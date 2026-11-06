import { describe, expect, it } from "vitest";
import { getFitViewPadding } from "./getFitViewPadding";

describe("getFitViewPadding", () => {
  it("가리는 UI가 없으면 기본 여백을 돌려준다", () => {
    expect(getFitViewPadding()).toEqual({
      top: "72px",
      right: "24px",
      bottom: "24px",
      left: "24px",
    });
  });

  it("가리는 높이만큼 아래 여백을 늘린다", () => {
    expect(getFitViewPadding(156).bottom).toBe("180px");
  });
});
