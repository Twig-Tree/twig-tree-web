import { useEffect, useState } from "react";
import { playSentence, type LectureAudioMode } from "./lectureSpeech";
import { runLectureAnimation } from "./runLectureAnimation";
import { useKoreanVoice } from "./useKoreanVoice";
import { useLectureScriptStore } from "./lectureScriptStore";

type UseLectureScriptPlaybackParams = {
  revealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // 접힌 조상을 펼치고 애니메이션 대상 노드를 화면에 모은다
  resetCamera: () => void; // 대본의 camera reset 동작이 전체 트리 화면으로 돌아가게 한다
};

/*
함수 이름 : useLectureScriptPlayback
기능 : 현재 비트의 내레이션과 애니메이션을 함께 시작하고 위치나 재생 상태가 바뀌면 둘 다 중단한다.
인자 : UseLectureScriptPlaybackParams
반환값 : 현재 음성 재생 방식
*/
export const useLectureScriptPlayback = ({
  revealNodes,
  resetCamera,
}: UseLectureScriptPlaybackParams): LectureAudioMode => {
  const status = useLectureScriptStore((state) => state.status);
  const script = useLectureScriptStore((state) => state.script);
  const sceneIndex = useLectureScriptStore((state) => state.sceneIndex);
  const beatIndex = useLectureScriptStore((state) => state.beatIndex);
  const completeBeat = useLectureScriptStore((state) => state.completeBeat);
  const koreanVoice = useKoreanVoice();
  const [hasSpeechFailed, setHasSpeechFailed] = useState(false);

  const audioMode: LectureAudioMode =
    koreanVoice !== null && !hasSpeechFailed ? "speech" : "silent";
  const voice = audioMode === "speech" ? koreanVoice : null;

  useEffect(() => {
    if (status !== "playing" || script === null) return;

    const beat = script.scenes[sceneIndex]?.beats[beatIndex];
    if (!beat) {
      completeBeat(sceneIndex, beatIndex);
      return;
    }

    const controller = new AbortController();
    const animationCompletion = runLectureAnimation(beat.animation, {
      revealNodes,
      resetCamera,
      signal: controller.signal,
    });
    let finishNarration = () => {};
    const narrationCompletion = new Promise<void>((resolve) => {
      finishNarration = resolve;
    });

    const stopNarration = playSentence({
      text: beat.narration.text,
      durationMs: beat.narration.fallbackDurationMs,
      voice,
      onEnd: finishNarration,
      onSpeechError: () => setHasSpeechFailed(true),
    });

    /*
    브라우저 음성 엔진이 발화를 실제로 재생하지 못하고 onend를 즉시 보내는 경우에도
    비트의 시각 동작은 끝까지 보여 준 뒤 다음 비트로 이동한다.
    */
    void Promise.all([animationCompletion, narrationCompletion]).then(() => {
      if (!controller.signal.aborted) completeBeat(sceneIndex, beatIndex);
    });

    return () => {
      controller.abort();
      stopNarration();
      finishNarration();
    };
  }, [
    status,
    script,
    sceneIndex,
    beatIndex,
    voice,
    completeBeat,
    revealNodes,
    resetCamera,
  ]);

  return audioMode;
};
