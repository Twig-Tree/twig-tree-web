import { describe, expect, it } from "vitest";
import {
  findKoreanVoice,
  findPreferredKoreanVoice,
  getSelectableKoreanVoices,
} from "./speechVoices";

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

  it("macOS의 다른 기본 음성보다 Yuna를 먼저 고른다", () => {
    const voices = [
      createVoice("ko-KR", "eddy", "Eddy"),
      createVoice("ko-KR", "grandma", "Grandma"),
      createVoice("ko-KR", "yuna", "Yuna"),
    ];

    expect(findKoreanVoice(voices)?.voiceURI).toBe("yuna");
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

describe("findPreferredKoreanVoice", () => {
  const yuna = createVoice("ko-KR", "yuna", "Yuna");
  const google = createVoice("ko-KR", "google", "Google 한국의");
  const samantha = createVoice("en-US", "samantha", "Samantha");

  it("고른 음성이 있으면 자동 순위보다 먼저 쓴다", () => {
    expect(findPreferredKoreanVoice([google, yuna], "yuna")).toBe(yuna);
  });

  it("고른 음성이 없으면 자동 선택으로 돌아간다", () => {
    expect(findPreferredKoreanVoice([google, yuna], "gone")).toBe(google);
  });

  it("고르지 않았으면 자동으로 고른다", () => {
    expect(findPreferredKoreanVoice([yuna, google], null)).toBe(google);
  });

  it("목록에서 뺀 음성을 골라 두었으면 자동 선택으로 돌아간다", () => {
    const eddy = createVoice("ko-KR", "eddy", "Eddy");

    expect(findPreferredKoreanVoice([eddy, yuna], "eddy")).toBe(yuna);
  });

  it("고른 값이 한국어 음성이 아니면 쓰지 않는다", () => {
    expect(findPreferredKoreanVoice([samantha, yuna], "samantha")).toBe(yuna);
  });

  it("한국어 음성이 없으면 null을 돌려준다", () => {
    expect(findPreferredKoreanVoice([samantha], "samantha")).toBeNull();
  });
});

describe("getSelectableKoreanVoices", () => {
  const getSelectableUris = (voices: SpeechSynthesisVoice[]) =>
    getSelectableKoreanVoices(voices).map((voice) => voice.voiceURI);

  it("Google 음성과 Yuna만 남기고 다른 기본 음성은 뺀다", () => {
    expect(
      getSelectableUris([
        createVoice("ko-KR", "eddy", "Eddy (한국어(대한민국))"),
        createVoice("ko-KR", "google", "Google 한국의"),
        createVoice("ko-KR", "rocko", "Rocko (한국어(대한민국))"),
        createVoice("ko-KR", "yuna", "Yuna"),
        createVoice("en-US", "samantha", "Samantha"),
      ]),
    ).toEqual(["google", "yuna"]);
  });

  it("Edge의 신경망 음성과 macOS의 고품질 음성은 남긴다", () => {
    expect(
      getSelectableUris([
        createVoice("ko-KR", "sunhi", "Microsoft SunHi Online (Natural)"),
        createVoice("ko-KR", "premium", "Yuna (Premium)"),
      ]),
    ).toEqual(["sunhi", "premium"]);
  });

  it("시스템 언어가 한국어여서 유나로 표기되어도 남긴다", () => {
    expect(getSelectableUris([createVoice("ko-KR", "yuna", "유나")])).toEqual([
      "yuna",
    ]);
  });
});
