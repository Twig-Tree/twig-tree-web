import { type RefObject, useEffect, useEffectEvent } from "react";
import {
  getNodeActionForKey,
  getNodeActionShortcuts,
  type NodeActionId,
} from "../../lib/shortcuts/nodeActionShortcuts";
import { useIsLectureActive } from "../lecture/lectureStore";
import { useDevicePlatform } from "../shortcuts/useDevicePlatform";
import { useTreeStore } from "../treeStore";

const TEXT_INPUT_SELECTOR = "input, textarea, select, [contenteditable]";
const ACTIVATABLE_SELECTOR = 'button, a[href], summary, [role="button"]';
/*
5단계의 단축키 안내처럼 화면 한쪽에 떠 있는 참고 패널은 data-non-blocking을 붙여 단축키를 막지 않는다.
막으면 안내를 연 채 노드를 누른 뒤 모든 단축키가 동작하지 않는다.
*/
const OPEN_OVERLAY_SELECTOR =
  '[role="menu"], [role="dialog"]:not([data-non-blocking]), [role="alertdialog"], dialog[open]';
const NODE_TITLE_SELECTOR = ".custom-node__content"; // 노드 제목 버튼. 노드를 누르면 여기에 focus가 간다

type UseNodeActionShortcutsParams = {
  canvasRef: RefObject<HTMLElement | null>; // 단축키가 동작하는 캔버스 영역
  targetClientId: string | null; // 동작을 실행할 노드. useNodeActions가 정한다
  onRunAction: (actionId: NodeActionId) => void; // useNodeActions의 runNodeAction. 막힌 동작은 그쪽에서 거른다
};

/*
함수 이름 : isClosestMatch
기능 : 이벤트가 일어난 요소나 그 조상이 선택자에 맞는지 확인한다.
인자 : EventTarget | null target -> 키 이벤트의 대상
string selector -> 확인할 선택자
반환값 : 맞으면 true
*/
const isClosestMatch = (target: EventTarget | null, selector: string) =>
  target instanceof Element && target.closest(selector) !== null;

/*
함수 이름 : useNodeActionShortcuts
기능 : 선택한 노드에 단축키로 동작을 실행하고, Tab으로 노드 아래 버튼에 focus를 옮기며, Escape로 선택을 푼다.
인자 : UseNodeActionShortcutsParams
반환값 : 없음

focus가 캔버스 안이나 페이지 바탕에 있을 때만 동작한다. 검색 패널이나 메모 패널에서 누른 키가 노드를 바꾸면 안 된다.
입력 중이거나 메뉴·대화상자가 열려 있으면 그 UI의 키이므로 넘긴다. 판단 기준은 강의 키보드 조작(useLectureKeyboard)과 같다.
강의 중에는 방향키·Space·Escape가 강의 조작 키이므로 아무것도 받지 않는다.

버튼에 focus가 있으면 그 버튼의 키이므로 넘긴다. 노드 아래 버튼도 여기에 들어가, 그 안의 Escape는 노드로 돌아가는 키로 남는다.
노드 제목 버튼은 예외다. CustomNode는 이 버튼의 Enter·Space로 이름 편집을 시작하고 전파를 막으므로, 맥의 Space 메모 열기와
Windows의 Enter 메모 열기가 닿으려면 capture 단계에서 먼저 받아야 한다.
*/
export function useNodeActionShortcuts({
  canvasRef,
  targetClientId,
  onRunAction,
}: UseNodeActionShortcutsParams) {
  const shortcuts = getNodeActionShortcuts(useDevicePlatform());
  const isLectureActive = useIsLectureActive();

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isLectureActive) return;
    if (event.defaultPrevented || event.isComposing || event.repeat) return;
    if (isClosestMatch(event.target, TEXT_INPUT_SELECTOR)) return;
    if (document.querySelector(OPEN_OVERLAY_SELECTOR)) return;

    const isInCanvas =
      event.target === document.body ||
      (event.target instanceof Node &&
        canvasRef.current?.contains(event.target) === true);
    if (!isInCanvas) return;

    if (
      isClosestMatch(event.target, ACTIVATABLE_SELECTOR) &&
      !isClosestMatch(event.target, NODE_TITLE_SELECTOR)
    ) {
      return;
    }

    /*
    노드 아래 버튼은 모든 노드 뒤에 그려져 Tab 순서로는 닿지 않으므로, 동작 대상 노드에 focus가 있을 때 Tab으로 첫 버튼에 보낸다.
    Shift+Tab은 원래대로 앞 요소로 간다.
    */
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      targetClientId !== null &&
      event.target instanceof Element &&
      event.target.closest<HTMLElement>(".react-flow__node")?.dataset.id ===
        targetClientId
    ) {
      const firstButton = document.querySelector<HTMLButtonElement>(
        `.react-flow__node-toolbar[data-id="${CSS.escape(targetClientId)}"] button`,
      );
      if (!firstButton) return;

      event.preventDefault();
      event.stopPropagation();
      firstButton.focus();
      return;
    }

    /*
    노드에 focus가 있으면 React Flow도 Escape로 선택을 푸는데, 이미 풀린 노드는 다시 선택한다.
    여기서 먼저 풀었으므로 React Flow까지 전파되지 않게 막는다.
    */
    if (event.key === "Escape") {
      const selectedNodes = useTreeStore
        .getState()
        .nodes.filter((node) => node.selected);
      if (selectedNodes.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      useTreeStore.getState().onNodesChange(
        selectedNodes.map((node) => ({
          type: "select",
          id: node.id,
          selected: false,
        })),
      );
      return;
    }

    if (targetClientId === null) return; // 여러 노드에 같은 동작을 실행하는 일은 다루지 않는다

    const actionId = getNodeActionForKey(event, shortcuts);
    if (!actionId) return;

    /*
    막힌 동작이어도 키는 여기서 끝낸다. 넘기면 맥의 Return이 노드 제목 버튼에 닿아, 막힌 이름 편집이 제목 버튼 쪽에서 열린다.
    */
    event.preventDefault(); // Space가 페이지를 스크롤하거나 →가 캔버스를 움직이지 않게 한다
    event.stopPropagation(); // 노드 제목 버튼이 이름 편집을 시작하지 않게 한다
    onRunAction(actionId);
  });

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);

    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
