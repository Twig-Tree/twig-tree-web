import { describe, expect, it } from "vitest";
import { getNodeActionForKey, getNodeActionShortcuts } from "./shortcuts";

const press = (
  key: string,
  modifiers: { meta?: boolean; shift?: boolean } = {},
) => ({
  key,
  metaKey: modifiers.meta ?? false,
  ctrlKey: false,
  altKey: false,
  shiftKey: modifiers.shift ?? false,
});

describe("getNodeActionShortcuts", () => {
  it("Windows는 F2로 이름을 바꾸고 Enter로 메모를 연다", () => {
    const shortcuts = getNodeActionShortcuts("windows");

    expect(getNodeActionForKey(press("F2"), shortcuts)).toBe("rename");
    expect(getNodeActionForKey(press("Enter"), shortcuts)).toBe("openMemo");
  });

  it("맥은 Return으로 이름을 바꾸고 Space로 메모를 연다", () => {
    const shortcuts = getNodeActionShortcuts("mac");

    expect(getNodeActionForKey(press("Enter"), shortcuts)).toBe("rename");
    expect(getNodeActionForKey(press(" "), shortcuts)).toBe("openMemo");
    expect(getNodeActionForKey(press("F2"), shortcuts)).toBeNull();
  });

  it("두 운영체제 모두 →로 자식을 추가하고 Backspace와 Delete로 삭제한다", () => {
    (["mac", "windows"] as const).forEach((platform) => {
      const shortcuts = getNodeActionShortcuts(platform);

      expect(getNodeActionForKey(press("ArrowRight"), shortcuts)).toBe(
        "addChild",
      );
      expect(getNodeActionForKey(press("Backspace"), shortcuts)).toBe("delete");
      expect(getNodeActionForKey(press("Delete"), shortcuts)).toBe("delete");
    });
  });

  /*
  Tab은 키보드 사용자가 화면 요소 사이를 옮겨 다니는 키라 동작으로 가로채지 않는다.
  */
  it("Tab은 어느 동작에도 쓰지 않는다", () => {
    (["mac", "windows"] as const).forEach((platform) => {
      expect(
        getNodeActionForKey(press("Tab"), getNodeActionShortcuts(platform)),
      ).toBeNull();
    });
  });
});

describe("getNodeActionForKey", () => {
  const shortcuts = getNodeActionShortcuts("mac");

  /*
  Shift+→는 텍스트 선택, ⌘→는 브라우저 단축키라 노드 동작으로 가로채지 않는다.
  */
  it("수정키가 붙으면 맞지 않는다", () => {
    expect(
      getNodeActionForKey(press("ArrowRight", { shift: true }), shortcuts),
    ).toBeNull();
    expect(
      getNodeActionForKey(press("ArrowRight", { meta: true }), shortcuts),
    ).toBeNull();
  });
});
