import { isSpeechSynthesisSupported } from "@/src/shared/lib/speech";

/*
speech: 브라우저 음성 합성으로 문장을 읽는다. muted: 읽을 수 있지만 사용자가 음성을 껐다. silent: 읽을 음성이 없다.
muted와 silent는 자막 시각만큼 기다렸다 넘어간다.
*/
export type LectureAudioMode = "speech" | "muted" | "silent";

/*
cancel()로 끊은 발화도 error 이벤트를 낸다. 일시정지와 장면 이동이 낸 것이므로 실패로 보지 않는다.
*/
const CANCELLED_SPEECH_ERRORS = new Set<string>(["interrupted", "canceled"]);

/*
Chrome의 온라인 음성은 읽던 발화를 cancel()한 직후 speak()하면 소리도 끝 이벤트도 없이 멈춘다. 100ms만 띄워도 정상으로 읽으므로 여유를 두고 기다린다.
*/
const SPEECH_RESTART_DELAY_MS = 150;

/*
끝 이벤트가 오지 않아도 강의가 멈추지 않게 하는 상한. 실제 낭독은 자막 시간보다 길 수 있어 넉넉히 곱한다.
낭독 시간은 속도에 반비례하므로 상한도 속도로 나눈다. 그러지 않으면 느린 속도의 정상 낭독이 상한에 걸려 끊긴다.
*/
const SPEECH_STALL_DURATION_RATIO = 3;

let speechRestartableAt = 0; // 끊긴 발화 뒤에 다음 발화를 시작해도 되는 시각

type PlaySentenceParams = {
  text: string; // 읽을 문장
  durationMs: number; // 음성 없이 넘어갈 때 기다릴 시간
  voice: SpeechSynthesisVoice | null; // 읽을 음성. null이면 음성 없이 시간만 흘린다
  volume: number; // 0부터 1까지의 음량
  rate: number; // 낭독 속도. 음성 없이 넘어가는 시간에는 적용하지 않는다
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

읽던 발화를 끊은 직후에만 시작을 늦춘다. 끊은 적이 없는 첫 문장은 클릭과 같은 흐름에서 바로 읽어야 하는 브라우저가 있기 때문이다.
*/
export const playSentence = ({
  text,
  durationMs,
  voice,
  volume,
  rate,
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
  utterance.volume = volume;
  utterance.rate = rate;

  let isSpeechFinished = false;
  let timeoutId: number | undefined;

  utterance.onend = () => {
    isSpeechFinished = true;
    window.clearTimeout(timeoutId);

    if (!isStopped) onEnd();
  };

  utterance.onerror = (event) => {
    if (isStopped || CANCELLED_SPEECH_ERRORS.has(event.error)) return;

    isSpeechFinished = true;
    window.clearTimeout(timeoutId);
    onSpeechError();
  };

  /*
  앞 문장의 발화가 큐에 남아 있으면 이 문장이 그 뒤로 밀린다. 한 번에 한 문장만 읽도록 비우고 시작한다.
  */
  const startSpeaking = () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    timeoutId = window.setTimeout(
      () => {
        stopSpeaking();
        onEnd();
      },
      (durationMs * SPEECH_STALL_DURATION_RATIO) / rate,
    );
  };

  /*
  다 읽은 발화는 끊을 것이 없으므로 다음 문장을 늦추지 않는다.
  */
  const stopSpeaking = () => {
    isStopped = true;
    window.clearTimeout(timeoutId);
    window.speechSynthesis.cancel();

    if (!isSpeechFinished) {
      speechRestartableAt = Date.now() + SPEECH_RESTART_DELAY_MS;
    }
  };

  const restartDelayMs = speechRestartableAt - Date.now();

  if (restartDelayMs > 0) {
    timeoutId = window.setTimeout(startSpeaking, restartDelayMs);
  } else {
    startSpeaking();
  }

  return stopSpeaking;
};
