import { describe, expect, it } from "vitest";
import { findKoreanVoice } from "./speechVoices";

const createVoice = (lang: string, voiceURI = lang, name = voiceURI) =>
  ({ lang, voiceURI, name }) as SpeechSynthesisVoice;

describe("findKoreanVoice", () => {
  it("자연스러운 음성이 없으면 언어 코드가 ko로 시작하는 첫 음성을 찾는다", () => {
    const voices = [
      createVoice("en-US"),
      createVoice("ko_KR", "ko-1"),
      createVoice("ko-KR", "ko-2"),
    ];

    expect(findKoreanVoice(voices)?.voiceURI).toBe("ko-1");
  });

  /*
  macOS Chrome처럼 기기 기본 음성이 목록 앞에 오고 온라인 음성이 뒤에 오는 경우다.
  */
  it("기본 음성보다 자연스러운 음성을 먼저 고른다", () => {
    const voices = [
      createVoice("ko-KR", "yuna", "Yuna"),
      createVoice("ko-KR", "google", "Google 한국의"),
    ];

    expect(findKoreanVoice(voices)?.voiceURI).toBe("google");
  });

  it("신경망 음성, 온라인 음성, 내려받은 고품질 음성 순으로 고른다", () => {
    const yuna = createVoice("ko-KR", "yuna", "Yuna");
    const enhanced = createVoice("ko-KR", "enhanced", "Yuna (Enhanced)");
    const premium = createVoice("ko-KR", "premium", "Yuna (Premium)");
    const google = createVoice("ko-KR", "google", "Google 한국의");
    const natural = createVoice(
      "ko-KR",
      "natural",
      "Microsoft SunHi Online (Natural) - Korean (Korea)",
    );

    expect(
      findKoreanVoice([yuna, enhanced, premium, google, natural])?.voiceURI,
    ).toBe("natural");
    expect(findKoreanVoice([yuna, enhanced, premium, google])?.voiceURI).toBe(
      "google",
    );
    expect(findKoreanVoice([yuna, enhanced, premium])?.voiceURI).toBe(
      "premium",
    );
    expect(findKoreanVoice([yuna, enhanced])?.voiceURI).toBe("enhanced");
  });

  it("macOS 시스템 언어가 한국어여서 품질이 한국어로 표기되어도 알아본다", () => {
    const voices = [
      createVoice("ko-KR", "yuna", "유나"),
      createVoice("ko-KR", "premium", "유나(프리미엄)"),
    ];

    expect(findKoreanVoice(voices)?.voiceURI).toBe("premium");
  });

  it("다른 언어의 자연스러운 음성은 고르지 않는다", () => {
    const voices = [
      createVoice("en-US", "google-en", "Google US English"),
      createVoice("ko-KR", "yuna", "Yuna"),
    ];

    expect(findKoreanVoice(voices)?.voiceURI).toBe("yuna");
  });

  it("한국어 음성이 없으면 null을 돌려준다", () => {
    expect(findKoreanVoice([createVoice("en-US")])).toBeNull();
    expect(findKoreanVoice([])).toBeNull();
  });
});
