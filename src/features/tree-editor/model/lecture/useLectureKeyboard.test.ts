import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EditorLectureScript } from "../types";
import { useLectureStore } from "./lectureStore";
import { useLectureKeyboard } from "./useLectureKeyboard";

const script: EditorLectureScript = {
  id: "script",
  title: "강의",
  scenes: [
    { id: "scene-1", clientId: "c1", beats: [] },
    { id: "scene-2", clientId: "c2", beats: [] },
  ],
};

const onStop = vi.fn();

const lecture = () => useLectureStore.getState();

const startLecture = () => {
  renderHook(() => useLectureKeyboard({ onStop }));
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

  it("Shift 없는 →는 다음 장면으로 가지 않는다", () => {
    startLecture();

    press({ key: "ArrowRight" });

    expect(lecture().sceneIndex).toBe(0);
  });

  it("Esc로 강의를 끝낸다", () => {
    startLecture();

    press({ key: "Escape" });

    expect(onStop).toHaveBeenCalledOnce();
  });

  it("강의 중이 아니면 동작하지 않는다", () => {
    renderHook(() => useLectureKeyboard({ onStop }));

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
    const { unmount } = renderHook(() => useLectureKeyboard({ onStop }));

    act(() => lecture().startLecture(script));
    unmount();
    press({ key: "Escape" });

    expect(onStop).not.toHaveBeenCalled();
  });
});
