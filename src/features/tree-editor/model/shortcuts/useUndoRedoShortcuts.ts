import { useEffect, useEffectEvent } from "react";
import {
  isClosestMatch,
  OPEN_OVERLAY_SELECTOR,
  TEXT_INPUT_SELECTOR,
} from "../../lib/shortcuts/keyboardTargets";
import { getUndoRedoActionForKey } from "../../lib/shortcuts/undoRedoShortcuts";
import { useIsLectureActive } from "../lecture/lectureStore";
import { useDevicePlatform } from "./useDevicePlatform";

type UseUndoRedoShortcutsParams = {
  onUndo: () => void; // useUndoRedo의 handleUndo. 툴바 버튼과 같은 handler
  onRedo: () => void; // useUndoRedo의 handleRedo
  isUndoDisabled: boolean; // 툴바 되돌리기 버튼과 같은 막힘 조건 (기록 없음, 요청 중)
  isRedoDisabled: boolean; // 툴바 다시 실행 버튼과 같은 막힘 조건
};

/*
함수 이름 : useUndoRedoShortcuts
기능 : 맥은 ⌘Z·⌘⇧Z, Windows는 Ctrl+Z·Ctrl+Shift+Z·Ctrl+Y로 트리 편집을 되돌리거나 다시 실행한다.
인자 : UseUndoRedoShortcutsParams
반환값 : 없음

노드 동작 단축키와 달리 focus가 캔버스 밖이어도, 버튼에 있어도 받는다. 툴바 되돌리기 버튼을 누른 직후에는 focus가 그 버튼에 있고,
버튼에는 ⌘Z의 기본 동작이 없다. 노드를 고르지 않아도 동작한다.
입력창 안의 ⌘Z는 글자 실행 취소라 넘긴다. 메뉴·대화상자가 열려 있으면 그 UI의 키이므로 넘긴다.
강의 중에는 트리를 바꾸지 않으므로 넘긴다.

capture가 아닌 bubble 단계에서 받는다. 노드 제목 버튼처럼 먼저 가로챌 요소가 없고, 컴포넌트가 ⌘Z를 직접 처리하면 그쪽을 따른다.
막혀 있어도 우리 키이므로 기본 동작은 막는다. 노드 동작 단축키가 막힌 동작의 키를 끝내는 것과 같다.
길게 누른 반복 입력은 받지 않는다. 기록마다 서버 요청이 나가, 연달아 되돌리면 어디까지 되돌렸는지 알기 어렵다.
*/
export function useUndoRedoShortcuts({
  onUndo,
  onRedo,
  isUndoDisabled,
  isRedoDisabled,
}: UseUndoRedoShortcutsParams) {
  const platform = useDevicePlatform();
  const isLectureActive = useIsLectureActive();

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat) return;
    if (isClosestMatch(event.target, TEXT_INPUT_SELECTOR)) return;
    if (document.querySelector(OPEN_OVERLAY_SELECTOR)) return;
    if (isLectureActive) return;

    const actionId = getUndoRedoActionForKey(event, platform);
    if (!actionId) return;

    event.preventDefault();

    if (actionId === "undo") {
      if (!isUndoDisabled) onUndo();
      return;
    }

    if (!isRedoDisabled) onRedo();
  });

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
