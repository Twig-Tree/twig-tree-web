import { describe, expect, it } from "vitest";
import {
  getUndoRedoActionForKey,
  getUndoRedoShortcuts,
} from "./undoRedoShortcuts";

const press = (
  key: string,
  modifiers: {
    meta?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    code?: string;
  } = {},
) => ({
  key,
  code: modifiers.code ?? `Key${key.toUpperCase()}`,
  metaKey: modifiers.meta ?? false,
  ctrlKey: modifiers.ctrl ?? false,
  altKey: modifiers.alt ?? false,
  shiftKey: modifiers.shift ?? false,
});

describe("getUndoRedoActionForKey", () => {
  it("맥은 ⌘Z로 실행 취소하고 ⌘⇧Z로 다시 실행한다", () => {
    expect(getUndoRedoActionForKey(press("z", { meta: true }), "mac")).toBe(
      "undo",
    );
    expect(
      getUndoRedoActionForKey(press("z", { meta: true, shift: true }), "mac"),
    ).toBe("redo");
  });

  it("맥은 Ctrl+Z와 ⌘Y를 받지 않는다", () => {
    expect(
      getUndoRedoActionForKey(press("z", { ctrl: true }), "mac"),
    ).toBeNull();
    expect(
      getUndoRedoActionForKey(press("y", { meta: true }), "mac"),
    ).toBeNull();
  });

  it("Windows는 Ctrl+Z로 실행 취소하고 Ctrl+Shift+Z와 Ctrl+Y로 다시 실행한다", () => {
    expect(getUndoRedoActionForKey(press("z", { ctrl: true }), "windows")).toBe(
      "undo",
    );
    expect(
      getUndoRedoActionForKey(
        press("Z", { ctrl: true, shift: true }),
        "windows",
      ),
    ).toBe("redo");
    expect(getUndoRedoActionForKey(press("y", { ctrl: true }), "windows")).toBe(
      "redo",
    );
  });

  it("Windows는 Win+Z와 Ctrl+Shift+Y를 받지 않는다", () => {
    expect(
      getUndoRedoActionForKey(press("z", { meta: true }), "windows"),
    ).toBeNull();
    expect(
      getUndoRedoActionForKey(
        press("Y", { ctrl: true, shift: true }),
        "windows",
      ),
    ).toBeNull();
  });

  it("⌥(Alt)가 붙거나 ⌘와 Ctrl을 함께 누르면 받지 않는다", () => {
    expect(
      getUndoRedoActionForKey(press("z", { meta: true, alt: true }), "mac"),
    ).toBeNull();
    expect(
      getUndoRedoActionForKey(press("z", { ctrl: true, alt: true }), "windows"),
    ).toBeNull();
    expect(
      getUndoRedoActionForKey(press("z", { meta: true, ctrl: true }), "mac"),
    ).toBeNull();
  });

  it("수정키 없이 누른 Z는 받지 않는다", () => {
    expect(getUndoRedoActionForKey(press("z"), "mac")).toBeNull();
    expect(getUndoRedoActionForKey(press("z"), "windows")).toBeNull();
  });

  it("Shift로 key가 대문자로 와도 같은 글자로 본다", () => {
    expect(
      getUndoRedoActionForKey(press("Z", { meta: true, shift: true }), "mac"),
    ).toBe("redo");
  });

  it("한글 입력 상태로 key가 라틴 글자가 아니면 code로 판단한다", () => {
    expect(
      getUndoRedoActionForKey(press("ㅋ", { meta: true, code: "KeyZ" }), "mac"),
    ).toBe("undo");
    expect(
      getUndoRedoActionForKey(
        press("ㅛ", { ctrl: true, code: "KeyY" }),
        "windows",
      ),
    ).toBe("redo");
  });

  it("key가 ASCII 글자면 code와 달라도 key를 따른다", () => {
    /*
    Dvorak 자판은 QWERTY의 Z 자리(code KeyZ)가 ;이고, 실제 z는 code가 Slash로 온다.
    */
    expect(
      getUndoRedoActionForKey(press(";", { meta: true, code: "KeyZ" }), "mac"),
    ).toBeNull();
    expect(
      getUndoRedoActionForKey(press("z", { meta: true, code: "Slash" }), "mac"),
    ).toBe("undo");
    expect(
      getUndoRedoActionForKey(press("v", { meta: true, code: "KeyZ" }), "mac"),
    ).toBeNull();
  });
});

describe("getUndoRedoShortcuts", () => {
  it("운영체제마다 표기와 aria-keyshortcuts가 다르다", () => {
    expect(getUndoRedoShortcuts("mac")).toEqual({
      undo: { label: "⌘Z", ariaKeyShortcuts: "Meta+Z" },
      redo: { label: "⌘⇧Z", ariaKeyShortcuts: "Meta+Shift+Z" },
    });
    expect(getUndoRedoShortcuts("windows").redo).toEqual({
      label: "Ctrl+Shift+Z",
      ariaKeyShortcuts: "Control+Shift+Z Control+Y",
    });
  });
});
