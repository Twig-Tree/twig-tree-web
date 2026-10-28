/*
speech: 브라우저 음성 합성으로 문장을 읽는다. silent: 음성 없이 자막 시각만큼 기다렸다 넘어간다.
*/
export type LectureAudioMode = "speech" | "silent";

/*
cancel()로 끊은 발화도 error 이벤트를 낸다. 일시정지와 구간 이동이 낸 것이므로 실패로 보지 않는다.
*/
const CANCELLED_SPEECH_ERRORS = new Set<string>(["interrupted", "canceled"]);

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
  const koreanVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("ko"),
  );

  return koreanVoices.reduce<SpeechSynthesisVoice | null>(
    (best, voice) =>
      best === null ||
      getVoiceNaturalnessRank(voice) < getVoiceNaturalnessRank(best)
        ? voice
        : best,
    null,
  );
};

type PlaySentenceParams = {
  text: string; // 읽을 문장
  durationMs: number; // 음성 없이 넘어갈 때 기다릴 시간
  voice: SpeechSynthesisVoice | null; // 읽을 음성. null이면 음성 없이 시간만 흘린다
  onEnd: () => void; // 문장을 다 읽었을 때 부른다
  onSpeechError: () => void; // 음성 합성이 실패했을 때 부른다. 끊어서 난 오류에는 부르지 않는다
};

/*
함수 이름 : playSentence
기능 : 문장 하나를 음성으로 읽거나, 음성이 없으면 정해진 시간만큼 기다린다.
인자 : PlaySentenceParams
반환값 : 읽기를 멈추는 함수. 멈춘 뒤에는 onEnd와 onSpeechError를 부르지 않는다

강의 전체가 아니라 문장 하나씩 읽는다. 문장이 끝나는 이벤트로 자막을 넘기므로 자막이 음성과 맞고,
Chrome에서 긴 발화가 15초 무렵 끊기는 문제도 피한다.
일시정지는 pause() 대신 멈추는 함수로 끊는다. pause()·resume()은 브라우저마다 동작이 달라
재개해도 소리가 나지 않는 경우가 있으므로, 다시 재생하면 지금 문장을 처음부터 읽는다.
*/
export const playSentence = ({
  text,
  durationMs,
  voice,
  onEnd,
  onSpeechError,
}: PlaySentenceParams): (() => void) => {
  let isStopped = false;

  if (voice === null || !isSpeechSynthesisSupported()) {
    const timeoutId = window.setTimeout(() => {
      if (!isStopped) onEnd();
    }, durationMs);

    return () => {
      isStopped = true;
      window.clearTimeout(timeoutId);
    };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;

  utterance.onend = () => {
    if (!isStopped) onEnd();
  };

  utterance.onerror = (event) => {
    if (isStopped || CANCELLED_SPEECH_ERRORS.has(event.error)) return;

    onSpeechError();
  };

  /*
  앞 문장의 발화가 큐에 남아 있으면 이 문장이 그 뒤로 밀린다. 한 번에 한 문장만 읽도록 비우고 시작한다.
  */
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return () => {
    isStopped = true;
    window.speechSynthesis.cancel();
  };
};
