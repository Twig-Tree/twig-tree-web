import { describe, expect, it } from "vitest";
import { hasKeyboardToolbar } from "./config";

describe("hasKeyboardToolbar", () => {
  it("선택된 노드에 버튼이 붙으면 키보드로 들어갈 수 있다", () => {
    expect(hasKeyboardToolbar("selected")).toBe(true);
    expect(hasKeyboardToolbar("hoverOrSelected")).toBe(true);
  });

  /*
  호버로만 보이는 버튼은 마우스를 위한 것이라 키보드로 들어갈 대상이 없다.
  */
  it("버튼이 없거나 호버로만 보이면 키보드로 들어갈 수 없다", () => {
    expect(hasKeyboardToolbar("off")).toBe(false);
    expect(hasKeyboardToolbar("hover")).toBe(false);
  });
});
