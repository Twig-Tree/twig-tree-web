import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getThemeInitScript } from "./themeInitScript";
import {
  getCurrentTheme,
  getCurrentThemePreference,
  setTheme,
  syncThemeFromStorageEvent,
} from "./themeStore";
import { DEFAULT_THEME, isThemeId, THEME_STORAGE_KEY } from "./themes";
import { useTheme } from "./useTheme";

const runInitScript = () => new Function(getThemeInitScript())();

const stubColorScheme = (isDark: boolean) =>
  vi.stubGlobal("matchMedia", () => ({ matches: isDark }));

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

  it.each([
    [true, "dark"],
    [false, "neutral"],
  ])(
    "시스템 설정이면 OS 색상 모드에 맞는 테마를 적용한다 (다크: %s)",
    (isDark, theme) => {
      stubColorScheme(isDark);
      document.documentElement.dataset.theme = DEFAULT_THEME;
      window.localStorage.setItem(THEME_STORAGE_KEY, "system");

      runInitScript();

      expect(document.documentElement.dataset.theme).toBe(theme);
      expect(document.documentElement.dataset.themePreference).toBe("system");
    },
  );

  it("OS 색상 모드를 읽을 수 없으면 서버가 그린 테마를 유지한다", () => {
    vi.stubGlobal("matchMedia", undefined);
    document.documentElement.dataset.theme = DEFAULT_THEME;
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");

    expect(runInitScript).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
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

  it("시스템 설정을 고르면 저장값은 system이고 문서에는 실제 테마가 적용된다", () => {
    stubColorScheme(true);

    setTheme("system");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(getCurrentThemePreference()).toBe("system");
  });

  it("시스템 설정에서 특정 테마로 바꾸면 선택값도 그 테마가 된다", () => {
    stubColorScheme(true);
    setTheme("system");

    setTheme("soft");

    expect(document.documentElement.dataset.themePreference).toBeUndefined();
    expect(getCurrentThemePreference()).toBe("soft");
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
    window.localStorage.setItem(THEME_STORAGE_KEY, "soft");

    syncThemeFromStorageEvent(createStorageEvent(THEME_STORAGE_KEY, "soft"));

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("이벤트의 값이 낡았으면 저장소의 최신 값을 따른다", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "neutral");

    syncThemeFromStorageEvent(createStorageEvent(THEME_STORAGE_KEY, "soft"));

    expect(document.documentElement.dataset.theme).toBe("neutral");
  });

  it("저장소를 읽을 수 없으면 지금 테마를 유지한다", () => {
    document.documentElement.dataset.theme = "soft";
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    syncThemeFromStorageEvent(createStorageEvent(THEME_STORAGE_KEY, "neutral"));

    expect(document.documentElement.dataset.theme).toBe("soft");
  });

  it("다른 탭이 시스템 설정을 고르면 OS 색상 모드를 따른다", () => {
    stubColorScheme(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");

    syncThemeFromStorageEvent(createStorageEvent(THEME_STORAGE_KEY, "system"));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getCurrentThemePreference()).toBe("system");
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

  it("시스템 설정이면 적용된 테마와 고른 값을 따로 돌려준다", () => {
    stubColorScheme(true);

    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("system"));

    expect(result.current.theme).toBe("dark");
    expect(result.current.preference).toBe("system");
  });
});
