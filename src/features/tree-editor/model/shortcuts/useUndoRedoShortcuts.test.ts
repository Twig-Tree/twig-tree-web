import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLectureStore } from "../lecture/lectureStore";
import { useNodeActionShortcuts } from "../node-action/useNodeActionShortcuts";
import { useUndoRedoShortcuts } from "./useUndoRedoShortcuts";

const press = (target: Element, options: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  target.dispatchEvent(event);

  return event;
};

const UNDO = { key: "z", code: "KeyZ", ctrlKey: true };
const REDO = { key: "Z", code: "KeyZ", ctrlKey: true, shiftKey: true };

/*
jsdom의 navigator.platform은 빈 문자열이라 Windows 표로 판단한다.
*/
describe("useUndoRedoShortcuts", () => {
  const onUndo = vi.fn();
  const onRedo = vi.fn();

  const renderShortcuts = ({
    isUndoDisabled = false,
    isRedoDisabled = false,
  } = {}) =>
    renderHook(() =>
      useUndoRedoShortcuts({ onUndo, onRedo, isUndoDisabled, isRedoDisabled }),
    );

  let button: HTMLButtonElement;

  beforeEach(() => {
    button = document.createElement("button");
    document.body.append(button);
  });

  afterEach(() => {
    onUndo.mockClear();
    onRedo.mockClear();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    useLectureStore.setState({ status: "idle" });
  });

  it("페이지 바탕에서 누른 Ctrl+Z와 Ctrl+Shift+Z·Ctrl+Y로 되돌리고 다시 실행한다", () => {
    renderShortcuts();

    const undoEvent = press(document.body, UNDO);
    press(document.body, REDO);
    press(document.body, { key: "y", code: "KeyY", ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(2);
    expect(undoEvent.defaultPrevented).toBe(true);
  });

  /*
  툴바 되돌리기 버튼을 누른 직후에는 focus가 그 버튼에 있다. 이어서 누른 단축키도 받아야 한다.
  */
  it("버튼에 focus가 있어도 받는다", () => {
    renderShortcuts();

    press(button, UNDO);

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("맥에서는 ⌘Z를 받고 Ctrl+Z는 받지 않는다", () => {
    vi.spyOn(Navigator.prototype, "platform", "get").mockReturnValue(
      "MacIntel",
    );
    renderShortcuts();

    const ctrlEvent = press(document.body, UNDO);
    press(document.body, { key: "z", code: "KeyZ", metaKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(ctrlEvent.defaultPrevented).toBe(false);
  });

  it("입력창 안의 키는 글자 실행 취소로 넘긴다", () => {
    renderShortcuts();
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    document.body.append(input, textarea, editable);

    const events = [input, textarea, editable].map((target) =>
      press(target, UNDO),
    );

    expect(onUndo).not.toHaveBeenCalled();
    expect(events.map((event) => event.defaultPrevented)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("메뉴나 대화상자가 열려 있으면 받지 않는다", () => {
    renderShortcuts();
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    document.body.append(menu);

    press(document.body, UNDO);
    menu.setAttribute("role", "dialog");
    press(document.body, UNDO);

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("단축키 안내처럼 막지 않는 패널이 열려 있으면 받는다", () => {
    renderShortcuts();
    const guide = document.createElement("div");
    guide.setAttribute("role", "dialog");
    guide.setAttribute("data-non-blocking", "");
    document.body.append(guide);

    press(document.body, UNDO);

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("강의 중에는 받지 않는다", () => {
    useLectureStore.setState({ status: "paused" });
    renderShortcuts();

    const event = press(document.body, UNDO);

    expect(onUndo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("조합 중이거나 길게 눌러 반복된 키는 받지 않는다", () => {
    renderShortcuts();

    press(document.body, { ...UNDO, isComposing: true });
    press(document.body, { ...UNDO, repeat: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  /*
  기록이 없거나 요청 중이면 실행하지 않지만, 브라우저가 대신 무언가를 되돌리지 않도록 키는 끝낸다.
  */
  it("막혀 있으면 실행하지 않고 기본 동작만 막는다", () => {
    renderShortcuts({ isUndoDisabled: true, isRedoDisabled: true });

    const undoEvent = press(document.body, UNDO);
    const redoEvent = press(document.body, REDO);

    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
    expect(undoEvent.defaultPrevented).toBe(true);
    expect(redoEvent.defaultPrevented).toBe(true);
  });

  it("다른 컴포넌트가 먼저 처리한 키는 받지 않는다", () => {
    renderShortcuts();
    button.addEventListener("keydown", (event) => event.preventDefault());

    press(button, UNDO);

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("노드 동작 단축키와 함께 켜 두어도 Ctrl+Z가 노드 동작으로 가지 않는다", () => {
    const onRunAction = vi.fn();
    renderShortcuts();
    renderHook(() =>
      useNodeActionShortcuts({
        canvasRef: { current: document.body },
        targetClientId: "c1",
        onRunAction,
        onToggleGuide: vi.fn(),
      }),
    );

    press(document.body, UNDO);

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRunAction).not.toHaveBeenCalled();
  });
});
