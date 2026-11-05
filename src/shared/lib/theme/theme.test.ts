import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getThemeInitScript } from "./themeInitScript";
import {
  getCurrentTheme,
  setTheme,
  syncThemeFromStorageEvent,
} from "./themeStore";
import { DEFAULT_THEME, isThemeId, THEME_STORAGE_KEY } from "./themes";
import { useTheme } from "./useTheme";

const runInitScript = () => new Function(getThemeInitScript())();

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

describe("isThemeId", () => {
  it.each(["neutral", "soft"])("%s는 제품 테마다", (value) => {
    expect(isThemeId(value)).toBe(true);
  });

  it.each(["warm", "", null, undefined])("%s는 제품 테마가 아니다", (value) => {
    expect(isThemeId(value)).toBe(false);
  });
});

describe("초기 스크립트", () => {
  it("저장된 테마를 문서에 적용한다", () => {
    document.documentElement.dataset.theme = DEFAULT_THEME;
    window.localStorage.setItem(THEME_STORAGE_KEY, "soft");

    runInitScript();

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("저장값이 제품에 없는 테마면 서버가 그린 테마를 유지한다", () => {
    document.documentElement.dataset.theme = DEFAULT_THEME;
    window.localStorage.setItem(THEME_STORAGE_KEY, "removed-theme");

    runInitScript();

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
  });

  it("저장값이 없으면 서버가 그린 테마를 유지한다", () => {
    document.documentElement.dataset.theme = DEFAULT_THEME;

    runInitScript();

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
  });

  it("저장소를 읽을 수 없어도 예외를 던지지 않는다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(runInitScript).not.toThrow();
  });
});

describe("setTheme", () => {
  it("문서에 적용하고 저장한다", () => {
    setTheme("soft");

    expect(document.documentElement.dataset.theme).toBe("soft");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("soft");
  });

  it("저장에 실패해도 문서에는 적용한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => setTheme("soft")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("soft");
  });
});

describe("getCurrentTheme", () => {
  it("문서의 값이 제품에 없는 테마면 기본 테마를 돌려준다", () => {
    document.documentElement.dataset.theme = "removed-theme";

    expect(getCurrentTheme()).toBe(DEFAULT_THEME);
  });
});

describe("syncThemeFromStorageEvent", () => {
  const createStorageEvent = (key: string | null, newValue: string | null) =>
    new StorageEvent("storage", { key, newValue });

  it("다른 탭이 고른 테마를 적용한다", () => {
    syncThemeFromStorageEvent(createStorageEvent(THEME_STORAGE_KEY, "soft"));

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("다른 키의 변경은 무시한다", () => {
    document.documentElement.dataset.theme = "soft";

    syncThemeFromStorageEvent(createStorageEvent("other-key", "neutral"));

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("저장값이 지워지면 기본 테마로 돌아간다", () => {
    document.documentElement.dataset.theme = "soft";

    syncThemeFromStorageEvent(createStorageEvent(THEME_STORAGE_KEY, null));

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
  });

  it("저장소 전체가 지워지면 기본 테마로 돌아간다", () => {
    document.documentElement.dataset.theme = "soft";

    syncThemeFromStorageEvent(createStorageEvent(null, null));

    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
  });
});

describe("useTheme", () => {
  it("테마가 바뀌면 다시 그린다", () => {
    document.documentElement.dataset.theme = "neutral";

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("neutral");

    act(() => result.current.setTheme("soft"));

    expect(result.current.theme).toBe("soft");
  });
});
