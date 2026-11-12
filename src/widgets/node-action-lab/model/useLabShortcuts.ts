import { type RefObject, useEffect, useEffectEvent } from "react";
import { useTreeStore } from "@/src/features/tree-editor";
import { type NodeActionId } from "./nodeActions";
import { getNodeActionForKey, type NodeActionShortcuts } from "./shortcuts";

const TEXT_INPUT_SELECTOR = "input, textarea, select, [contenteditable]";
const OPEN_OVERLAY_SELECTOR =
  '[role="menu"], [role="dialog"], [role="alertdialog"], dialog[open]';
const ACTIVATABLE_SELECTOR = 'button, a[href], summary, [role="button"]';
const NODE_TITLE_SELECTOR = ".custom-node__content"; // 제품 노드의 제목 버튼. 노드를 누르면 여기에 focus가 간다

type UseLabShortcutsParams = {
  shortcutsEnabled: boolean; // 키를 눌러 동작을 실행할지 여부
  guideEnabled: boolean; // ?로 단축키 안내를 열 수 있는지 여부
  toolbarEntryKey: string | null; // 선택된 노드에서 노드 옆 버튼으로 들어가는 키. 선택된 노드에 버튼이 붙지 않으면 null
  shortcuts: NodeActionShortcuts; // 지금 쓰는 단축키 표
  canvasRef: RefObject<HTMLElement | null>; // 단축키가 동작하는 영역
  onRunAction: (actionId: NodeActionId, clientId: string) => void;
  onToggleGuide: () => void;
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
함수 이름 : useLabShortcuts
기능 : 하나만 선택된 노드에 단축키로 동작을 실행하고, 노드 옆 버튼으로 focus를 옮기며, ?로 단축키 안내를 열고 닫고, Escape로 선택을 푼다.
인자 : UseLabShortcutsParams
반환값 : 없음

동작 단축키는 focus가 캔버스 안이나 페이지 바탕에 있을 때만 동작한다. 설정 패널에서 Tab으로 이동하는데 선택된 노드에 자식이 생기면 안 된다.
입력 중이거나 메뉴·대화상자가 열려 있으면 그 UI의 키이므로 넘긴다. 판단 기준은 강의 키보드 조작(useLectureKeyboard)과 같다.
노드 옆 버튼 같은 일반 버튼의 Enter·Space는 버튼을 누르는 키라 넘기지만, 노드 제목 버튼은 예외다. 노드를 누르면 focus가 여기에 가는데,
제품 노드는 이 버튼의 Enter·Space로 서버 저장을 거치는 이름 편집을 시작하고 전파를 막는다. 그래서 capture 단계에서 먼저 받는다.
*/
export function useLabShortcuts({
  shortcutsEnabled,
  guideEnabled,
  toolbarEntryKey,
  shortcuts,
  canvasRef,
  onRunAction,
  onToggleGuide,
}: UseLabShortcutsParams) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat) return;
    if (isClosestMatch(event.target, TEXT_INPUT_SELECTOR)) return;
    if (document.querySelector(OPEN_OVERLAY_SELECTOR)) return;

    /*
    안내는 무엇을 누를지 모를 때 여는 것이므로 focus가 어디에 있든 연다.
    */
    if (event.key === "?") {
      if (!guideEnabled) return;

      event.preventDefault();
      onToggleGuide();
      return;
    }

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

    const selectedNodes = useTreeStore
      .getState()
      .nodes.filter((node) => node.selected);

    /*
    노드 옆 버튼은 모든 노드 뒤에 그려져 Tab 순서로는 닿지 않으므로, 선택된 노드에 focus가 있을 때 정한 키로 첫 버튼에 focus를 옮긴다.
    들어가는 키는 단축키와 겹치지 않게 getToolbarEntryKey가 정한다.
    */
    if (
      toolbarEntryKey !== null &&
      event.key === toolbarEntryKey &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      selectedNodes.length === 1 &&
      event.target instanceof Element &&
      event.target.closest<HTMLElement>(".react-flow__node")?.dataset.id ===
        selectedNodes[0].id
    ) {
      const firstButton = document.querySelector<HTMLButtonElement>(
        `.react-flow__node-toolbar[data-id="${CSS.escape(selectedNodes[0].id)}"] button`,
      );

      if (firstButton) {
        event.preventDefault();
        event.stopPropagation();
        firstButton.focus();
        return;
      }
    }

    if (!shortcutsEnabled) return;

    /*
    노드에 focus가 있으면 React Flow도 Escape로 선택을 푸는데, 이미 풀린 노드는 다시 선택한다.
    여기서 먼저 풀었으므로 React Flow까지 전파되지 않게 막는다.
    */
    if (event.key === "Escape") {
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

    const actionId = getNodeActionForKey(event, shortcuts);
    if (!actionId || selectedNodes.length !== 1) return; // 여러 노드에 같은 동작을 실행하는 일은 다루지 않는다

    event.preventDefault(); // Tab이 focus를 옮기거나 Space가 페이지를 스크롤하지 않게 한다
    event.stopPropagation(); // 제품 노드 제목 버튼이 이름 편집을 시작하지 않게 한다
    onRunAction(actionId, selectedNodes[0].id);
  });

  const isListening =
    shortcutsEnabled || guideEnabled || toolbarEntryKey !== null;

  useEffect(() => {
    if (!isListening) return;

    document.addEventListener("keydown", handleKeyDown, true);

    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isListening]);
}
