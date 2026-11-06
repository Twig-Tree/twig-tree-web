import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeSync } from "./ThemeSync";
import { THEME_STORAGE_KEY } from "./themes";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("ThemeSync", () => {
  it("다른 탭의 storage 이벤트를 받아 테마를 적용한다", () => {
    document.documentElement.dataset.theme = "neutral";
    window.localStorage.setItem(THEME_STORAGE_KEY, "neutral");

    render(<ThemeSync />);

    act(() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "soft");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "soft",
        }),
      );
    });

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("구독을 시작할 때 놓친 저장값을 적용한다", () => {
    document.documentElement.dataset.theme = "neutral";
    window.localStorage.setItem(THEME_STORAGE_KEY, "soft");

    render(<ThemeSync />);

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("해제한 뒤에는 이벤트를 받지 않는다", () => {
    document.documentElement.dataset.theme = "neutral";
    window.localStorage.setItem(THEME_STORAGE_KEY, "neutral");

    const { unmount } = render(<ThemeSync />);

    unmount();
    window.localStorage.setItem(THEME_STORAGE_KEY, "soft");
    window.dispatchEvent(
      new StorageEvent("storage", { key: THEME_STORAGE_KEY, newValue: "soft" }),
    );

    expect(document.documentElement.dataset.theme).toBe("neutral");
  });
});
