import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { findKoreanVoice, playSentence } from "./lectureSpeech";

const createVoice = (lang: string, voiceURI = lang) =>
  ({ lang, voiceURI, name: voiceURI }) as SpeechSynthesisVoice;

/*
jsdom에는 음성 합성 API가 없으므로, 발화를 기록만 하는 가짜를 window에 얹는다.
*/
class FakeUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

const speak = vi.fn<(utterance: FakeUtterance) => void>();
const cancel = vi.fn();

const getLastUtterance = () => speak.mock.lastCall![0];

describe("findKoreanVoice", () => {
  it("언어 코드가 ko로 시작하는 첫 음성을 찾는다", () => {
    const voices = [
      createVoice("en-US"),
      createVoice("ko_KR", "ko-1"),
      createVoice("ko-KR", "ko-2"),
    ];

    expect(findKoreanVoice(voices)?.voiceURI).toBe("ko-1");
  });

  it("한국어 음성이 없으면 null을 돌려준다", () => {
    expect(findKoreanVoice([createVoice("en-US")])).toBeNull();
    expect(findKoreanVoice([])).toBeNull();
  });
});

describe("playSentence: 음성 없이", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("문장 시간만큼 기다린 뒤 끝을 알린다", () => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice: null,
      onEnd,
      onSpeechError: vi.fn(),
    });

    vi.advanceTimersByTime(999);
    expect(onEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("멈추면 끝을 알리지 않는다", () => {
    const onEnd = vi.fn();

    const stop = playSentence({
      text: "문장",
      durationMs: 1000,
      voice: null,
      onEnd,
      onSpeechError: vi.fn(),
    });

    stop();
    vi.advanceTimersByTime(1000);

    expect(onEnd).not.toHaveBeenCalled();
  });
});

describe("playSentence: 음성으로", () => {
  const voice = createVoice("ko-KR");

  beforeEach(() => {
    speak.mockClear();
    cancel.mockClear();
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", { speak, cancel });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("남은 발화를 비우고 문장을 한국어 음성으로 읽는다", () => {
    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });

    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      speak.mock.invocationCallOrder[0],
    );
    expect(getLastUtterance()).toMatchObject({
      text: "문장",
      voice,
      lang: "ko-KR",
    });
  });

  it("발화가 끝나면 끝을 알린다", () => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      onEnd,
      onSpeechError: vi.fn(),
    });
    getLastUtterance().onend?.();

    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("멈추면 발화를 끊고, 그 뒤에 온 이벤트는 알리지 않는다", () => {
    const onEnd = vi.fn();
    const onSpeechError = vi.fn();

    const stop = playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      onEnd,
      onSpeechError,
    });
    cancel.mockClear();

    stop();
    getLastUtterance().onend?.();
    getLastUtterance().onerror?.({ error: "synthesis-failed" });

    expect(cancel).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
    expect(onSpeechError).not.toHaveBeenCalled();
  });

  it("끊어서 난 오류는 실패로 알리지 않는다", () => {
    const onSpeechError = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      onEnd: vi.fn(),
      onSpeechError,
    });
    getLastUtterance().onerror?.({ error: "interrupted" });
    getLastUtterance().onerror?.({ error: "canceled" });

    expect(onSpeechError).not.toHaveBeenCalled();
  });

  it("음성 합성이 실패하면 알린다", () => {
    const onSpeechError = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      onEnd: vi.fn(),
      onSpeechError,
    });
    getLastUtterance().onerror?.({ error: "synthesis-failed" });

    expect(onSpeechError).toHaveBeenCalledOnce();
  });
});
