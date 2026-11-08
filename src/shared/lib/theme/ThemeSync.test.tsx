import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeSync } from "./ThemeSync";
import { THEME_STORAGE_KEY } from "./themes";

/*
jsdom에는 matchMedia가 없으므로, 색상 모드를 바꾸면 구독자에게 알리는 가짜를 둔다.
*/
const stubColorScheme = (initialIsDark: boolean) => {
  let isDark = initialIsDark;
  const listeners = new Set<() => void>();

  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return isDark;
    },
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  }));

  return (nextIsDark: boolean) => {
    isDark = nextIsDark;
    listeners.forEach((listener) => listener());
  };
};

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
  vi.unstubAllGlobals();
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

  it("시스템 설정을 고른 동안 OS 색상 모드가 바뀌면 따라간다", () => {
    const setColorScheme = stubColorScheme(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");

    render(<ThemeSync />);
    expect(document.documentElement.dataset.theme).toBe("neutral");

    act(() => setColorScheme(true));

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("특정 테마를 고른 동안에는 OS 색상 모드를 따라가지 않는다", () => {
    const setColorScheme = stubColorScheme(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "soft");

    render(<ThemeSync />);
    act(() => setColorScheme(true));

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("해제한 뒤에는 OS 색상 모드 변경을 받지 않는다", () => {
    const setColorScheme = stubColorScheme(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");

    const { unmount } = render(<ThemeSync />);

    unmount();
    setColorScheme(true);

    expect(document.documentElement.dataset.theme).toBe("neutral");
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
