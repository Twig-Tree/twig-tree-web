import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useThemeMenuItems } from "./useThemeMenuItems";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("useThemeMenuItems", () => {
  it("현재 테마에만 선택 표시를 한다", () => {
    document.documentElement.dataset.theme = "soft";

    const { result } = renderHook(() => useThemeMenuItems());

    expect(
      result.current.map(({ label, checked }) => [label, checked]),
    ).toEqual([
      ["Neutral 테마", false],
      ["Soft 테마", true],
    ]);
  });

  it("항목을 고르면 테마를 적용하고 선택 표시를 옮긴다", () => {
    document.documentElement.dataset.theme = "neutral";

    const { result } = renderHook(() => useThemeMenuItems());
    const softItem = result.current.find((item) => item.label === "Soft 테마");

    act(() => softItem?.onSelect?.());

    expect(document.documentElement.dataset.theme).toBe("soft");
    expect(
      result.current.find((item) => item.label === "Soft 테마")?.checked,
    ).toBe(true);
  });
});
