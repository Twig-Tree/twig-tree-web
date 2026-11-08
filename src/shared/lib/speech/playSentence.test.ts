import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { playSentence } from "./playSentence";

const createVoice = (lang: string, voiceURI = lang, name = voiceURI) =>
  ({ lang, voiceURI, name }) as SpeechSynthesisVoice;

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

/*
재시작 대기 시각은 모듈에 남으므로, 앞 테스트가 끊은 발화의 영향을 받지 않게 테스트마다 시계를 크게 옮긴다.
*/
let testNow = Date.now();

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
      volume: 1,
      rate: 1,
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
      volume: 1,
      rate: 1,
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
    testNow += 60_000;
    vi.useFakeTimers({ now: testNow });
    speak.mockClear();
    cancel.mockClear();
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", { speak, cancel });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("남은 발화를 비우고 문장을 한국어 음성으로 읽는다", () => {
    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
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

  it("음량과 속도를 발화에 적용한다", () => {
    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      volume: 0.4,
      rate: 1.25,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });

    expect(getLastUtterance()).toMatchObject({ volume: 0.4, rate: 1.25 });
  });

  it("발화가 끝나면 끝을 알린다", () => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
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
      volume: 1,
      rate: 1,
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
      volume: 1,
      rate: 1,
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
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError,
    });
    getLastUtterance().onerror?.({ error: "synthesis-failed" });

    expect(onSpeechError).toHaveBeenCalledOnce();
  });

  /*
  Chrome의 온라인 음성은 cancel() 직후의 speak()를 읽지 못하고 끝 이벤트도 보내지 않는다.
  */
  it("읽던 발화를 끊은 직후의 문장은 잠시 뒤에 읽는다", () => {
    const stop = playSentence({
      text: "앞 문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });

    stop();
    playSentence({
      text: "다음 문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });
    expect(getLastUtterance().text).toBe("앞 문장");

    vi.advanceTimersByTime(150);
    expect(getLastUtterance().text).toBe("다음 문장");
  });

  it("다 읽은 뒤의 문장은 바로 읽는다", () => {
    const stop = playSentence({
      text: "앞 문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });

    getLastUtterance().onend?.();
    stop();
    playSentence({
      text: "다음 문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });

    expect(getLastUtterance().text).toBe("다음 문장");
  });

  it("시작을 기다리는 동안 멈추면 읽지 않는다", () => {
    const stopPrevious = playSentence({
      text: "앞 문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });

    stopPrevious();
    const stop = playSentence({
      text: "다음 문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd: vi.fn(),
      onSpeechError: vi.fn(),
    });
    stop();
    vi.advanceTimersByTime(1000);

    expect(getLastUtterance().text).toBe("앞 문장");
  });

  it("끝 이벤트가 오지 않으면 발화를 끊고 끝을 알린다", () => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd,
      onSpeechError: vi.fn(),
    });
    cancel.mockClear();

    vi.advanceTimersByTime(2999);
    expect(onEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(cancel).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it.each([
    [0.75, 4000],
    [1.5, 2000],
  ])("시간 상한을 속도 %s에 맞춰 %sms로 보정한다", (rate, stallMs) => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate,
      onEnd,
      onSpeechError: vi.fn(),
    });

    vi.advanceTimersByTime(stallMs - 1);
    expect(onEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("음성 없이 넘어가는 시간에는 속도를 적용하지 않는다", () => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice: null,
      volume: 1,
      rate: 1.5,
      onEnd,
      onSpeechError: vi.fn(),
    });

    vi.advanceTimersByTime(999);
    expect(onEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("끝 이벤트가 오면 나중에 다시 끝을 알리지 않는다", () => {
    const onEnd = vi.fn();

    playSentence({
      text: "문장",
      durationMs: 1000,
      voice,
      volume: 1,
      rate: 1,
      onEnd,
      onSpeechError: vi.fn(),
    });
    getLastUtterance().onend?.();
    vi.advanceTimersByTime(3000);

    expect(onEnd).toHaveBeenCalledOnce();
  });
});
