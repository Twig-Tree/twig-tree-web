import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKoreanVoiceOptions } from "./useKoreanVoice";

const YUNA = { name: "Yuna", lang: "ko-KR", voiceURI: "yuna" };
const SAMANTHA = { name: "Samantha", lang: "en-US", voiceURI: "samantha" };

const stubSpeech = (initialVoices: unknown[]) => {
  let voices = initialVoices;
  let notifyVoicesChanged = () => {};

  vi.stubGlobal("SpeechSynthesisUtterance", class {});
  vi.stubGlobal("speechSynthesis", {
    getVoices: () => voices,
    addEventListener: (_type: string, listener: () => void) => {
      notifyVoicesChanged = listener;
    },
    removeEventListener: vi.fn(),
  });

  return (nextVoices: unknown[]) => {
    voices = nextVoices;
    notifyVoicesChanged();
  };
};

/*
구독 해제와 발화 중단이 음성 합성 API를 부르므로, stub을 걷기 전에 먼저 해제한다.
*/
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useKoreanVoiceOptions", () => {
  it("음성 합성을 지원하지 않으면 빈 목록을 돌려준다", () => {
    const { result } = renderHook(() => useKoreanVoiceOptions());

    expect(result.current).toEqual([]);
  });

  it("한국어 음성만 돌려준다", () => {
    stubSpeech([SAMANTHA, YUNA]);

    const { result } = renderHook(() => useKoreanVoiceOptions());

    expect(result.current).toEqual([{ voiceUri: "yuna", name: "Yuna" }]);
  });

  it("음성 목록이 늦게 채워지면 다시 그린다", () => {
    const setVoices = stubSpeech([]);
    const { result } = renderHook(() => useKoreanVoiceOptions());

    expect(result.current).toEqual([]);

    act(() => setVoices([YUNA]));

    expect(result.current).toEqual([{ voiceUri: "yuna", name: "Yuna" }]);
  });

  it("목록이 그대로면 같은 배열을 유지한다", () => {
    stubSpeech([YUNA]);

    const { result, rerender } = renderHook(() => useKoreanVoiceOptions());
    const before = result.current;

    rerender();

    expect(result.current).toBe(before);
  });
});
