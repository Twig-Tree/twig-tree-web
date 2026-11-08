import { useEffect, useRef, useState } from "react";
import { playSentence } from "@/src/shared/lib/speech";

const PREVIEW_TEXT = "안녕하세요. 지금 고른 음성으로 강의를 읽어 드립니다.";

const PREVIEW_DURATION_MS = 4000; // 끝 이벤트가 오지 않을 때의 상한을 정하는 기준 시간

type UseVoicePreviewParams = {
  voice: SpeechSynthesisVoice | null; // 읽을 음성
  volume: number; // 0부터 1까지의 음량
  rate: number; // 낭독 속도
};

/*
함수 이름 : useVoicePreview
기능 : 고른 음성, 음량, 속도로 짧은 문장을 읽어 준다. 음소거는 강의 재생에만 적용하므로 미리 듣기에는 쓰지 않는다.
인자 : UseVoicePreviewParams
반환값 : 재생 여부, 실패 여부, 재생과 멈춤을 전환하는 함수
*/
export const useVoicePreview = ({
  voice,
  volume,
  rate,
}: UseVoicePreviewParams) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPreviewFailed, setHasPreviewFailed] = useState(false);
  const stopPreviewRef = useRef<(() => void) | null>(null);

  const finishPreview = () => {
    stopPreviewRef.current = null;
    setIsPreviewing(false);
  };

  const togglePreview = () => {
    if (isPreviewing) {
      stopPreviewRef.current?.();
      finishPreview();
      return;
    }

    if (voice === null) return;

    setHasPreviewFailed(false);
    setIsPreviewing(true);
    stopPreviewRef.current = playSentence({
      text: PREVIEW_TEXT,
      durationMs: PREVIEW_DURATION_MS,
      voice,
      volume,
      rate,
      onEnd: finishPreview,
      onSpeechError: () => {
        finishPreview();
        setHasPreviewFailed(true);
      },
    });
  };

  /*
  페이지를 떠나도 브라우저의 발화는 계속되므로 직접 끊는다.
  */
  useEffect(() => () => stopPreviewRef.current?.(), []);

  return { isPreviewing, hasPreviewFailed, togglePreview };
};
