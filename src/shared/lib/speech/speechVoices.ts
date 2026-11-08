/*
함수 이름 : isSpeechSynthesisSupported
기능 : 브라우저가 음성 합성 API를 제공하는지 판단한다.
인자 : 없음
반환값 : 음성 합성을 쓸 수 있으면 true
*/
export const isSpeechSynthesisSupported = (): boolean =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof window.SpeechSynthesisUtterance === "function";

/*
자연스럽게 들리는 음성의 이름 패턴. 앞에 있을수록 먼저 고른다.
- Edge의 신경망 음성: "Microsoft SunHi Online (Natural) - Korean (Korea)"
- Chrome의 온라인 음성: "Google 한국의"
- macOS에서 내려받은 고품질 음성: "Yuna (Premium)", "Yuna (Enhanced)". 시스템 언어에 따라 한국어로 표기되기도 한다
*/
const NATURAL_VOICE_NAME_PATTERNS = [
  /natural/i,
  /google/i,
  /premium|프리미엄/i,
  /enhanced|향상/i,
];

/*
함수 이름 : getVoiceNaturalnessRank
기능 : 음성 이름으로 얼마나 자연스럽게 들리는지 순위를 매긴다.
인자 : SpeechSynthesisVoice voice -> 순위를 매길 음성
반환값 : 작을수록 자연스러운 순위. 어느 패턴에도 맞지 않으면 패턴 개수
*/
const getVoiceNaturalnessRank = (voice: SpeechSynthesisVoice): number => {
  const rank = NATURAL_VOICE_NAME_PATTERNS.findIndex((pattern) =>
    pattern.test(voice.name),
  );

  return rank === -1 ? NATURAL_VOICE_NAME_PATTERNS.length : rank;
};

const getKoreanVoices = (
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice[] =>
  voices.filter((voice) => voice.lang.toLowerCase().startsWith("ko"));

/*
함수 이름 : findKoreanVoice
기능 : 음성 목록에서 가장 자연스럽게 들리는 한국어 음성을 찾는다. 브라우저마다 언어 표기가 "ko-KR", "ko_KR"처럼 달라 앞의 언어 코드만 비교한다.
인자 : SpeechSynthesisVoice[] voices -> 브라우저가 제공하는 음성 목록
반환값 : 한국어 음성. 없으면 null

목록은 보통 기기에 설치된 기본 음성이 앞에 오므로, 첫 한국어 음성을 쓰면 온라인·고품질 음성이 있어도 기계적인 기본 음성이 골라진다.
이름으로 순위를 매기고, 순위가 같으면 목록 순서를 따른다. 이름 표기는 브라우저가 정하는 값이라 맞지 않으면 기본 음성으로 돌아간다.

한국어 음성이 없을 때 lang만 ko-KR로 두고 읽게 하지 않는다. 브라우저가 다른 언어 음성으로 한국어를 읽거나
소리 없이 넘어가는데, 화면은 음성이 나오는 것처럼 보이게 된다.
*/
export const findKoreanVoice = (
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null => {
  return getKoreanVoices(voices).reduce<SpeechSynthesisVoice | null>(
    (best, voice) =>
      best === null ||
      getVoiceNaturalnessRank(voice) < getVoiceNaturalnessRank(best)
        ? voice
        : best,
    null,
  );
};

/*
함수 이름 : findPreferredKoreanVoice
기능 : 사용자가 고른 한국어 음성을 찾고, 없으면 가장 자연스러운 한국어 음성을 찾는다.
인자 : SpeechSynthesisVoice[] voices -> 브라우저가 제공하는 음성 목록
string | null preferredVoiceUri -> 사용자가 고른 음성. null이면 자동으로 고른다
반환값 : 한국어 음성. 없으면 null

쓸 수 있는 음성은 기기와 브라우저마다 다르므로, 다른 기기에서 고른 값이거나 사라진 음성이면 자동 선택으로 돌아간다.
*/
export const findPreferredKoreanVoice = (
  voices: SpeechSynthesisVoice[],
  preferredVoiceUri: string | null,
): SpeechSynthesisVoice | null =>
  getKoreanVoices(voices).find(
    (voice) => voice.voiceURI === preferredVoiceUri,
  ) ?? findKoreanVoice(voices);
