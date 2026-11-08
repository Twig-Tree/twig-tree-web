import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVoiceSettings } from "./useVoiceSettings";
import {
  DEFAULT_VOICE_SETTINGS,
  getVoiceSettingsFromStoredValue,
  VOICE_SETTINGS_STORAGE_KEY,
} from "./voiceSettings";
import {
  getVoiceSettings,
  syncVoiceSettingsFromStorage,
  updateVoiceSettings,
} from "./voiceSettingsStore";

const SAVED_SETTINGS = {
  voiceUri: "yuna",
  volume: 0.5,
  rate: 1.25,
  isMuted: true,
};

const dispatchStorageEvent = (key: string | null) =>
  window.dispatchEvent(new StorageEvent("storage", { key }));

const saveSettings = (settings: unknown) =>
  window.localStorage.setItem(
    VOICE_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  syncVoiceSettingsFromStorage();
});

describe("getVoiceSettingsFromStoredValue", () => {
  it("저장값이 없으면 기본값을 돌려준다", () => {
    expect(getVoiceSettingsFromStoredValue(null)).toEqual(
      DEFAULT_VOICE_SETTINGS,
    );
  });

  it("저장된 설정을 읽는다", () => {
    expect(
      getVoiceSettingsFromStoredValue(JSON.stringify(SAVED_SETTINGS)),
    ).toEqual(SAVED_SETTINGS);
  });

  it.each(["{깨진 값", "null", "1", '"text"'])(
    "객체로 읽을 수 없는 값(%s)이면 기본값을 돌려준다",
    (storedValue) => {
      expect(getVoiceSettingsFromStoredValue(storedValue)).toEqual(
        DEFAULT_VOICE_SETTINGS,
      );
    },
  );

  it.each([
    ["voiceUri", 1, null],
    ["volume", 1.5, 1],
    ["volume", -0.1, 1],
    ["volume", "0.5", 1],
    ["rate", 3, 1],
    ["isMuted", "true", false],
  ])("%s가 %s이면 그 항목만 기본값으로 채운다", (field, value, fallback) => {
    const storedValue = JSON.stringify({ ...SAVED_SETTINGS, [field]: value });

    expect(getVoiceSettingsFromStoredValue(storedValue)).toEqual({
      ...SAVED_SETTINGS,
      [field]: fallback,
    });
  });

  it("음량 0은 올바른 값으로 읽는다", () => {
    const storedValue = JSON.stringify({ ...SAVED_SETTINGS, volume: 0 });

    expect(getVoiceSettingsFromStoredValue(storedValue).volume).toBe(0);
  });
});

describe("updateVoiceSettings", () => {
  it("바꾼 항목만 적용하고 저장한다", () => {
    updateVoiceSettings({ volume: 0.3 });

    const expected = { ...DEFAULT_VOICE_SETTINGS, volume: 0.3 };

    expect(getVoiceSettings()).toEqual(expected);
    expect(
      JSON.parse(window.localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY)!),
    ).toEqual(expected);
  });

  it("저장에 실패해도 현재 값에는 적용한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    updateVoiceSettings({ rate: 1.5 });

    expect(getVoiceSettings().rate).toBe(1.5);
  });
});

describe("syncVoiceSettingsFromStorage", () => {
  it("저장소를 읽을 수 없으면 현재 값을 유지한다", () => {
    updateVoiceSettings({ rate: 0.75 });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    syncVoiceSettingsFromStorage();

    expect(getVoiceSettings().rate).toBe(0.75);
  });

  it("내용이 같으면 같은 객체를 유지한다", () => {
    updateVoiceSettings({ rate: 0.75 });
    const before = getVoiceSettings();

    syncVoiceSettingsFromStorage();

    expect(getVoiceSettings()).toBe(before);
  });
});

describe("useVoiceSettings", () => {
  it("저장된 설정을 돌려준다", () => {
    saveSettings(SAVED_SETTINGS);

    const { result } = renderHook(() => useVoiceSettings());

    expect(result.current.voiceSettings).toEqual(SAVED_SETTINGS);
  });

  it("설정을 바꾸면 다시 그린다", () => {
    const { result } = renderHook(() => useVoiceSettings());

    act(() => result.current.updateVoiceSettings({ isMuted: true }));

    expect(result.current.voiceSettings.isMuted).toBe(true);
  });

  it("다른 탭에서 바꾼 설정을 따른다", () => {
    const { result } = renderHook(() => useVoiceSettings());

    saveSettings(SAVED_SETTINGS);
    act(() => dispatchStorageEvent(VOICE_SETTINGS_STORAGE_KEY));

    expect(result.current.voiceSettings).toEqual(SAVED_SETTINGS);
  });

  it("다른 탭이 저장소를 비우면 기본값으로 돌아간다", () => {
    saveSettings(SAVED_SETTINGS);
    const { result } = renderHook(() => useVoiceSettings());

    window.localStorage.clear();
    act(() => dispatchStorageEvent(null));

    expect(result.current.voiceSettings).toEqual(DEFAULT_VOICE_SETTINGS);
  });

  it("다른 키의 변경은 무시한다", () => {
    const { result } = renderHook(() => useVoiceSettings());
    const before = result.current.voiceSettings;

    saveSettings(SAVED_SETTINGS);
    act(() => dispatchStorageEvent("other-key"));

    expect(result.current.voiceSettings).toBe(before);
  });

  it("구독자가 없던 동안 바뀐 설정을 구독할 때 읽는다", () => {
    const { unmount } = renderHook(() => useVoiceSettings());

    unmount();
    saveSettings(SAVED_SETTINGS);

    const { result } = renderHook(() => useVoiceSettings());

    expect(result.current.voiceSettings).toEqual(SAVED_SETTINGS);
  });

  describe("저장에 실패한 뒤", () => {
    const failNextSave = (rate: 0.75 | 1.5) => {
      const setItem = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new DOMException("full", "QuotaExceededError");
        });

      updateVoiceSettings({ rate });
      setItem.mockRestore();
    };

    it("다시 구독해도 고른 값을 유지한다", () => {
      saveSettings(SAVED_SETTINGS);
      const first = renderHook(() => useVoiceSettings());

      failNextSave(0.75);
      first.unmount();

      const second = renderHook(() => useVoiceSettings());

      expect(second.result.current.voiceSettings.rate).toBe(0.75);
    });

    it("다른 탭이 저장한 값은 따른다", () => {
      const { result } = renderHook(() => useVoiceSettings());

      failNextSave(0.75);
      saveSettings(SAVED_SETTINGS);
      act(() => dispatchStorageEvent(VOICE_SETTINGS_STORAGE_KEY));

      expect(result.current.voiceSettings).toEqual(SAVED_SETTINGS);
    });

    it("다음 저장이 성공하면 다시 구독할 때 저장값을 읽는다", () => {
      const first = renderHook(() => useVoiceSettings());

      failNextSave(0.75);
      act(() => updateVoiceSettings({ rate: 1.25 }));
      first.unmount();
      saveSettings(SAVED_SETTINGS);

      const second = renderHook(() => useVoiceSettings());

      expect(second.result.current.voiceSettings).toEqual(SAVED_SETTINGS);
    });
  });

  it("구독을 모두 해제하면 저장소 이벤트를 받지 않는다", () => {
    const { unmount } = renderHook(() => useVoiceSettings());
    const before = getVoiceSettings();

    unmount();
    saveSettings(SAVED_SETTINGS);
    dispatchStorageEvent(VOICE_SETTINGS_STORAGE_KEY);

    expect(getVoiceSettings()).toBe(before);
  });
});
