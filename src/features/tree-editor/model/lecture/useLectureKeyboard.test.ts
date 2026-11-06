import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EditorLectureScript } from "../types";
import { useLectureStore } from "./lectureStore";
import { useLectureKeyboard } from "./useLectureKeyboard";

const createBeat = (id: string) => ({
  id,
  narration: { text: id, fallbackDurationMs: 1000 },
  animation: {
    type: "group" as const,
    mode: "sequence" as const,
    children: [],
  },
});

const script: EditorLectureScript = {
  id: "script",
  title: "강의",
  scenes: [
    {
      id: "scene-1",
      clientId: "c1",
      beats: [createBeat("a"), createBeat("b")],
    },
    { id: "scene-2", clientId: "c2", beats: [createBeat("c")] },
  ],
};

const onStop = vi.fn();
const onToggleMute = vi.fn();
const onRefocusCamera = vi.fn();
const keyboardParams = { onStop, onToggleMute, onRefocusCamera };

const lecture = () => useLectureStore.getState();

const startLecture = () => {
  renderHook(() => useLectureKeyboard(keyboardParams));
  act(() => lecture().startLecture(script));
};

const press = (init: KeyboardEventInit, target: Element = document.body) =>
  act(() => {
    fireEvent.keyDown(target, init);
  });

const appendToBody = (html: string) => {
  document.body.innerHTML = html;

  return document.body.firstElementChild as Element;
};

beforeEach(() => {
  onStop.mockReset();
  onToggleMute.mockReset();
  onRefocusCamera.mockReset();
  lecture().resetLecture();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useLectureKeyboard", () => {
  it("Space로 일시정지하고 다시 재생한다", () => {
    startLecture();

    press({ key: " " });
    expect(lecture().status).toBe("paused");

    press({ key: " " });
    expect(lecture().status).toBe("playing");
  });

  it("Shift + →로 다음 장면으로 간다", () => {
    startLecture();

    press({ key: "ArrowRight", shiftKey: true });

    expect(lecture().sceneIndex).toBe(1);
  });

  it("→와 ←로 비트를 옮기고 Shift + ←로 이전 장면으로 간다", () => {
    startLecture();

    press({ key: "ArrowRight" });
    expect(lecture()).toMatchObject({ sceneIndex: 0, beatIndex: 1 });

    press({ key: "ArrowLeft" });
    expect(lecture()).toMatchObject({ sceneIndex: 0, beatIndex: 0 });

    press({ key: "ArrowRight", shiftKey: true });
    press({ key: "ArrowLeft", shiftKey: true });
    expect(lecture()).toMatchObject({ sceneIndex: 0, beatIndex: 0 });
  });

  it("R은 한글 입력 상태에서도 지금 비트를 다시 재생한다", () => {
    startLecture();
    const { seekId } = lecture();

    press({ key: "ㄱ", code: "KeyR" });

    expect(lecture().seekId).toBe(seekId + 1);
  });

  it("M은 한글 입력 상태에서도 음성을 켜고 끈다", () => {
    startLecture();

    press({ key: "ㅡ", code: "KeyM" });

    expect(onToggleMute).toHaveBeenCalledOnce();
  });

  it("F는 한글 입력 상태에서도 카메라를 되돌린다", () => {
    startLecture();

    press({ key: "ㄹ", code: "KeyF" });

    expect(onRefocusCamera).toHaveBeenCalledOnce();
  });

  it("Esc로 강의를 끝낸다", () => {
    startLecture();

    press({ key: "Escape" });

    expect(onStop).toHaveBeenCalledOnce();
  });

  it("강의 중이 아니면 동작하지 않는다", () => {
    renderHook(() => useLectureKeyboard(keyboardParams));

    press({ key: "Escape" });

    expect(onStop).not.toHaveBeenCalled();
  });

  it("끝난 강의에서는 동작하지 않는다", () => {
    startLecture();
    act(() => useLectureStore.setState({ status: "ended" }));

    press({ key: " " });
    press({ key: "Escape" });

    expect(lecture().status).toBe("ended");
    expect(onStop).not.toHaveBeenCalled();
  });

  it.each([
    "<input />",
    "<textarea></textarea>",
    '<div contenteditable="true"></div>',
  ])("%s에 입력 중이면 동작하지 않는다", (html) => {
    startLecture();
    const input = appendToBody(html);

    press({ key: " " }, input);
    press({ key: "Escape" }, input);

    expect(lecture().status).toBe("playing");
    expect(onStop).not.toHaveBeenCalled();
  });

  it("버튼에 포커스가 있으면 Space는 버튼에 맡기고 다른 키는 동작한다", () => {
    startLecture();
    const button = appendToBody("<button>버튼</button>");

    press({ key: " " }, button);
    expect(lecture().status).toBe("playing");

    press({ key: "ArrowRight", shiftKey: true }, button);
    expect(lecture().sceneIndex).toBe(1);
  });

  it("메뉴가 열려 있으면 동작하지 않는다", () => {
    startLecture();
    appendToBody('<div role="menu"></div>');

    press({ key: "Escape" });

    expect(onStop).not.toHaveBeenCalled();
  });

  it.each([
    { repeat: true },
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
  ])("%o이면 동작하지 않는다", (init) => {
    startLecture();

    press({ key: " ", ...init });

    expect(lecture().status).toBe("playing");
  });

  it("언마운트하면 동작하지 않는다", () => {
    const { unmount } = renderHook(() => useLectureKeyboard(keyboardParams));

    act(() => lecture().startLecture(script));
    unmount();
    press({ key: "Escape" });

    expect(onStop).not.toHaveBeenCalled();
  });
});
