import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { getLectureSeekState } from "./getLectureSeekState";
import { playSentence, type LectureAudioMode } from "./lectureSpeech";
import { useLectureAnimationStore } from "./lectureAnimationStore";
import { runLectureAnimation } from "./runLectureAnimation";
import { useKoreanVoice } from "./useKoreanVoice";
import { useLectureCameraRefit } from "./useLectureCameraRefit";
import { useLectureCollapseRestore } from "./useLectureCollapseRestore";
import { useLectureStore } from "./lectureStore";

type UseLecturePlaybackParams = {
  revealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // 접힌 조상을 펼치고 애니메이션 대상 노드를 화면에 모은다
  resetCamera: () => void; // 대본의 camera reset 동작이 전체 트리 화면으로 돌아가게 한다
  onBeforeCollapseRestore: () => void; // 강의가 끝나 접힘을 되돌리면 보이는 노드가 달라질 때 직전에 부른다
  panelLayoutKey: string; // 패널 배치를 나타내는 값. 강의 중에 바뀌면 마지막 카메라 동작을 다시 실행한다
};

/*
함수 이름 : useLecturePlayback
기능 : 현재 비트의 내레이션과 애니메이션을 함께 시작하고 위치나 재생 상태가 바뀌면 둘 다 중단한다.
인자 : UseLecturePlaybackParams
반환값 : 현재 음성 재생 방식, 음성을 켜고 끄는 함수, 설명 중인 노드로 카메라를 되돌리는 함수
*/
export const useLecturePlayback = ({
  revealNodes,
  resetCamera,
  onBeforeCollapseRestore,
  panelLayoutKey,
}: UseLecturePlaybackParams) => {
  useLectureCollapseRestore(onBeforeCollapseRestore);

  const { runCameraMove, repeatLastCameraMove, forgetLastCameraMove } =
    useLectureCameraRefit(panelLayoutKey);

  const status = useLectureStore((state) => state.status);
  const script = useLectureStore((state) => state.script);
  const sceneIndex = useLectureStore((state) => state.sceneIndex);
  const beatIndex = useLectureStore((state) => state.beatIndex);
  const seekId = useLectureStore((state) => state.seekId);
  const completeBeat = useLectureStore((state) => state.completeBeat);
  const koreanVoice = useKoreanVoice();
  const [hasSpeechFailed, setHasSpeechFailed] = useState(false);

  const [isMuted, setIsMuted] = useState(false);

  const isVoiceAvailable = koreanVoice !== null && !hasSpeechFailed;
  const audioMode: LectureAudioMode = !isVoiceAvailable
    ? "silent"
    : isMuted
      ? "muted"
      : "speech";
  const voice = audioMode === "speech" ? koreanVoice : null;

  const toggleMute = () => {
    if (isVoiceAvailable) setIsMuted((current) => !current);
  };

  /*
  revealNodes는 보이는 노드가 바뀔 때마다 새 함수가 된다. effect가 이 함수에 반응하면 접힌 노드를 펼치거나 트리를 편집할 때
  읽던 비트가 처음부터 다시 시작되므로, effect event로 감싸 위치와 재생 상태가 바뀔 때만 비트를 시작한다.
  */
  const revealBeatNodes = useEffectEvent(
    (clientIds: string[], options: { maxZoom: number; duration: number }) =>
      revealNodes(clientIds, options),
  );
  const resetBeatCamera = useEffectEvent(() => resetCamera());
  const getBeatVoice = useEffectEvent(() => voice);

  const appliedSeekIdRef = useRef(seekId);
  const shouldWaitForSeekRef = useRef(false);
  const changeNarrationVoiceRef = useRef<
    ((nextVoice: SpeechSynthesisVoice | null) => void) | null
  >(null);

  /*
  사용자가 위치를 옮기면 그 위치의 접힘과 유지되는 강조를 대본에서 다시 계산해 적용한다. 뒤로 가도 앞 비트가 바꾼 상태가 돌아오지 않기 때문이다.
  바뀐 접힘이 그려져 레이아웃이 시작된 뒤에야 카메라가 최종 좌표를 알 수 있으므로 카메라와 비트의 애니메이션은 다음 프레임으로 미룬다.
  일시정지 중에는 비트가 시작되지 않으므로 그 비트의 연출까지 적용해 옮긴 위치를 보여 준다.
  비트를 시작하는 effect가 미룰지 알아야 하므로 먼저 선언한다.
  */
  useEffect(() => {
    if (appliedSeekIdRef.current === seekId) return;

    appliedSeekIdRef.current = seekId;

    const lecture = useLectureStore.getState();

    if (
      lecture.script === null ||
      (lecture.status !== "playing" && lecture.status !== "paused")
    ) {
      return;
    }

    const collapse = useCollapseStore.getState();
    const { nodes, edges } = useTreeStore.getState();
    const seekState = getLectureSeekState({
      script: lecture.script,
      sceneIndex: lecture.sceneIndex,
      beatIndex: lecture.beatIndex,
      isTargetBeatIncluded: lecture.status === "paused",
      nodes,
      edges,
      baseCollapsedServerIds:
        collapse.savedCollapsedServerIds ?? collapse.collapsedServerIds,
    });

    collapse.replaceTemporaryCollapse(seekState.collapsedServerIds);

    const animationStore = useLectureAnimationStore.getState();

    animationStore.resetVisual();
    seekState.layers.forEach(animationStore.setLayer);

    shouldWaitForSeekRef.current = lecture.status === "playing";

    const { camera } = seekState;

    /*
    옮긴 위치까지 카메라 동작이 없으면 뒤에 있던 비트의 동작이 남아, 다시 맞출 때 아직 설명하지 않은 노드로 간다.
    */
    if (camera === null) {
      forgetLastCameraMove();
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      runCameraMove(() => {
        if (camera.type === "reset") {
          resetBeatCamera();
          return;
        }

        revealBeatNodes(camera.clientIds, camera.options);
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [seekId, runCameraMove, forgetLastCameraMove]);

  useEffect(() => {
    if (status !== "playing" || script === null) return;

    const beat = script.scenes[sceneIndex]?.beats[beatIndex];
    if (!beat) {
      completeBeat(sceneIndex, beatIndex);
      return;
    }

    const controller = new AbortController();
    const runBeatAnimation = () =>
      runLectureAnimation(beat.animation, {
        revealNodes: (clientIds, options) =>
          runCameraMove(() => revealBeatNodes(clientIds, options)),
        resetCamera: () => runCameraMove(() => resetBeatCamera()),
        signal: controller.signal,
      });
    let cancelSeekFrame = () => {};
    const animationCompletion = shouldWaitForSeekRef.current
      ? new Promise<void>((resolve) => {
          const frameId = window.requestAnimationFrame(() => {
            void runBeatAnimation().then(resolve);
          });

          cancelSeekFrame = () => {
            window.cancelAnimationFrame(frameId);
            resolve();
          };
        })
      : runBeatAnimation();

    shouldWaitForSeekRef.current = false;

    let finishNarration = () => {};
    const narrationCompletion = new Promise<void>((resolve) => {
      finishNarration = resolve;
    });

    const { text, fallbackDurationMs } = beat.narration;
    const narrationStartedAt = Date.now();
    let narrationVoice = getBeatVoice();
    let isNarrationFinished = false;
    let stopNarration = () => {};

    const startNarration = (durationMs: number) => {
      stopNarration = playSentence({
        text,
        durationMs,
        voice: narrationVoice,
        onEnd: () => {
          isNarrationFinished = true;
          finishNarration();
        },
        onSpeechError: () => setHasSpeechFailed(true),
      });
    };

    startNarration(fallbackDurationMs);

    /*
    음성이 바뀌어도 비트를 다시 시작하지 않는다. 음성을 끌 때마다 화면 연출이 처음으로 돌아가면 안 되기 때문이다.
    내레이션만 갈아 끼운다. 끄면 자막을 읽을 남은 시간만 기다리고, 켜면 지금 문장을 처음부터 읽는다.
    */
    changeNarrationVoiceRef.current = (nextVoice) => {
      if (nextVoice === narrationVoice || isNarrationFinished) return;

      narrationVoice = nextVoice;
      stopNarration();

      const elapsedMs = Date.now() - narrationStartedAt;

      startNarration(
        nextVoice === null
          ? Math.max(fallbackDurationMs - elapsedMs, 0)
          : fallbackDurationMs,
      );
    };

    /*
    브라우저 음성 엔진이 발화를 실제로 재생하지 못하고 onend를 즉시 보내는 경우에도
    비트의 시각 동작은 끝까지 보여 준 뒤 다음 비트로 이동한다.
    */
    void Promise.all([animationCompletion, narrationCompletion]).then(() => {
      if (!controller.signal.aborted) completeBeat(sceneIndex, beatIndex);
    });

    return () => {
      changeNarrationVoiceRef.current = null;
      controller.abort();
      cancelSeekFrame();
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
  }, [
    status,
    script,
    sceneIndex,
    beatIndex,
    seekId,
    completeBeat,
    runCameraMove,
  ]);

  useEffect(() => {
    changeNarrationVoiceRef.current?.(voice);
  }, [voice]);

  return { audioMode, toggleMute, refocusCamera: repeatLastCameraMove };
};
