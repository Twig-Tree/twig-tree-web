import { useEffect, useEffectEvent, useState } from "react";
import { playSentence, type LectureAudioMode } from "./lectureSpeech";
import { useLectureAnimationStore } from "./lectureAnimationStore";
import { runLectureAnimation } from "./runLectureAnimation";
import { useKoreanVoice } from "./useKoreanVoice";
import { useLectureStore } from "./lectureStore";

type UseLecturePlaybackParams = {
  revealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // 접힌 조상을 펼치고 애니메이션 대상 노드를 화면에 모은다
  resetCamera: () => void; // 대본의 camera reset 동작이 전체 트리 화면으로 돌아가게 한다
};

/*
함수 이름 : useLecturePlayback
기능 : 현재 비트의 내레이션과 애니메이션을 함께 시작하고 위치나 재생 상태가 바뀌면 둘 다 중단한다.
인자 : UseLecturePlaybackParams
반환값 : 현재 음성 재생 방식
*/
export const useLecturePlayback = ({
  revealNodes,
  resetCamera,
}: UseLecturePlaybackParams): LectureAudioMode => {
  const status = useLectureStore((state) => state.status);
  const script = useLectureStore((state) => state.script);
  const sceneIndex = useLectureStore((state) => state.sceneIndex);
  const beatIndex = useLectureStore((state) => state.beatIndex);
  const completeBeat = useLectureStore((state) => state.completeBeat);
  const koreanVoice = useKoreanVoice();
  const [hasSpeechFailed, setHasSpeechFailed] = useState(false);

  const audioMode: LectureAudioMode =
    koreanVoice !== null && !hasSpeechFailed ? "speech" : "silent";
  const voice = audioMode === "speech" ? koreanVoice : null;

  /*
  revealNodes는 보이는 노드가 바뀔 때마다 새 함수가 된다. effect가 이 함수에 반응하면 접힌 노드를 펼치거나 트리를 편집할 때
  읽던 비트가 처음부터 다시 시작되므로, effect event로 감싸 위치와 재생 상태가 바뀔 때만 비트를 시작한다.
  */
  const revealBeatNodes = useEffectEvent(
    (clientIds: string[], options: { maxZoom: number; duration: number }) =>
      revealNodes(clientIds, options),
  );
  const resetBeatCamera = useEffectEvent(() => resetCamera());

  useEffect(() => {
    if (status !== "playing" || script === null) return;

    const beat = script.scenes[sceneIndex]?.beats[beatIndex];
    if (!beat) {
      completeBeat(sceneIndex, beatIndex);
      return;
    }

    const controller = new AbortController();
    const animationCompletion = runLectureAnimation(beat.animation, {
      revealNodes: (clientIds, options) => revealBeatNodes(clientIds, options),
      resetCamera: () => resetBeatCamera(),
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

      /*
      persist 레이어는 같은 장면의 다음 비트와 일시정지 화면에서는 유지한다.
      장면을 떠나거나 강의가 끝나면 대본의 reset 누락과 수동 건너뛰기에도 남지 않게 정리한다.
      */
      const nextState = useLectureStore.getState();
      const hasLeftScene =
        nextState.script !== script || nextState.sceneIndex !== sceneIndex;
      const hasStopped =
        nextState.status === "idle" || nextState.status === "ended";

      if (hasLeftScene || hasStopped) {
        useLectureAnimationStore.getState().resetVisual();
      }
    };
  }, [status, script, sceneIndex, beatIndex, voice, completeBeat]);

  return audioMode;
};
