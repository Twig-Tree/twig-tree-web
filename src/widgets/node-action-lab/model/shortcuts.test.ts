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
    const shortcuts = getNodeActionShortcuts("windows", "space");

    expect(getNodeActionForKey(press("F2"), shortcuts)).toBe("rename");
    expect(getNodeActionForKey(press("Enter"), shortcuts)).toBe("openMemo");
  });

  it("맥은 Return으로 이름을 바꾸고 F2를 쓰지 않는다", () => {
    const shortcuts = getNodeActionShortcuts("mac", "space");

    expect(getNodeActionForKey(press("Enter"), shortcuts)).toBe("rename");
    expect(getNodeActionForKey(press("F2"), shortcuts)).toBeNull();
  });

  it("맥의 메모 열기는 고른 후보 키를 따른다", () => {
    expect(
      getNodeActionForKey(press(" "), getNodeActionShortcuts("mac", "space")),
    ).toBe("openMemo");
    expect(
      getNodeActionForKey(
        press("Enter", { meta: true }),
        getNodeActionShortcuts("mac", "metaEnter"),
      ),
    ).toBe("openMemo");
    expect(
      getNodeActionForKey(
        press("ArrowDown", { meta: true }),
        getNodeActionShortcuts("mac", "metaArrowDown"),
      ),
    ).toBe("openMemo");
  });

  it("두 운영체제 모두 Backspace와 Delete로 삭제한다", () => {
    (["mac", "windows"] as const).forEach((platform) => {
      const shortcuts = getNodeActionShortcuts(platform, "space");

      expect(getNodeActionForKey(press("Backspace"), shortcuts)).toBe("delete");
      expect(getNodeActionForKey(press("Delete"), shortcuts)).toBe("delete");
    });
  });
});

describe("getNodeActionForKey", () => {
  const shortcuts = getNodeActionShortcuts("mac", "metaEnter");

  /*
  Shift+→는 텍스트 선택 같은 다른 조합이라 자식 추가로 가로채지 않는다.
  */
  it("단축키에 없는 수정키가 붙으면 맞지 않는다", () => {
    expect(getNodeActionForKey(press("ArrowRight"), shortcuts)).toBe(
      "addChild",
    );
    expect(
      getNodeActionForKey(press("ArrowRight", { shift: true }), shortcuts),
    ).toBeNull();
  });

  it("Tab은 화면 요소 사이를 옮겨 다니는 키라 동작에 쓰지 않는다", () => {
    (["mac", "windows"] as const).forEach((platform) => {
      expect(
        getNodeActionForKey(
          press("Tab"),
          getNodeActionShortcuts(platform, "space"),
        ),
      ).toBeNull();
    });
  });

  it("⌘가 필요한 단축키는 ⌘ 없이 맞지 않는다", () => {
    expect(getNodeActionForKey(press("Enter"), shortcuts)).toBe("rename");
    expect(getNodeActionForKey(press("Enter", { meta: true }), shortcuts)).toBe(
      "openMemo",
    );
  });

  it("⌘가 필요 없는 단축키는 ⌘와 함께 누르면 맞지 않는다", () => {
    expect(
      getNodeActionForKey(press("ArrowRight", { meta: true }), shortcuts),
    ).toBeNull();
  });
});
