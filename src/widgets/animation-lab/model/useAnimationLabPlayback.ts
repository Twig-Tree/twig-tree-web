import { useEffect, useEffectEvent, useState } from "react";
import { type LectureAnimation } from "@/src/entities/lecture";
import {
  createLectureNodeIdResolver,
  getEditorLectureAnimation,
  runLectureAnimation,
  useLectureAnimationStore,
  useTreeStore,
  type EditorLectureAnimation,
  type EditorLectureAnimationAction,
} from "@/src/features/tree-editor";

const SEQUENCE_GAP_MS = 160; // 순차 단계 사이의 전환 간격
const LOOP_GAP_MS = 700; // 반복 재생에서 다음 회차까지 쉬는 시간

type UseAnimationLabPlaybackParams = {
  revealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // focus 동작이 대상 노드를 화면에 모으는 함수
  resetCamera: () => void; // reset 동작이 전체 트리 화면으로 돌아가는 함수
  isLooping: boolean; // 끝나면 처음부터 다시 재생할지 여부
};

const getStageLabel = (action: EditorLectureAnimationAction): string => {
  switch (action.type) {
    case "focus":
      return "Focus";
    case "highlight":
      return action.style === "steady"
        ? "Highlight"
        : `${action.style[0].toUpperCase()}${action.style.slice(1)}`;
    case "dim":
      return "Dim";
    case "trace":
      return action.mode === "progressive" ? "Progressive trace" : "Trace";
    case "wait":
      return "Wait";
    case "collapse":
      return "Collapse";
    case "expand":
      return "Expand";
    case "reset":
      return "Reset";
  }
};

/*
함수 이름 : useAnimationLabPlayback
기능 : 타임라인에서 만든 애니메이션을 제품과 같은 실행기로 재생하고, 중단과 반복을 처리한다.
인자 : UseAnimationLabPlaybackParams
반환값 : 재생 함수, 중단 함수, 재생 여부, 지금 실행 중인 동작 이름
*/
export const useAnimationLabPlayback = ({
  revealNodes,
  resetCamera,
  isLooping,
}: UseAnimationLabPlaybackParams) => {
  const [running, setRunning] = useState<{
    animation: EditorLectureAnimation;
  } | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  /*
  revealNodes는 보이는 노드가 바뀔 때마다 새 함수가 된다. effect가 이 함수에 반응하면 접힌 노드를 펼치는 순간
  재생이 처음부터 다시 시작되므로, effect event로 감싸 재생 요청이 바뀔 때만 시작한다.
  */
  const revealStepNodes = useEffectEvent(
    (clientIds: string[], options: { maxZoom: number; duration: number }) =>
      revealNodes(clientIds, options),
  );
  const resetStepCamera = useEffectEvent(() => resetCamera());
  const getIsLooping = useEffectEvent(() => isLooping);

  useEffect(() => {
    if (running === null) return;

    const controller = new AbortController();
    const { signal } = controller;

    const runOnce = () => {
      useLectureAnimationStore.getState().resetVisual();

      return runLectureAnimation(running.animation, {
        revealNodes: (clientIds, options) =>
          revealStepNodes(clientIds, options),
        resetCamera: () => resetStepCamera(),
        signal,
        sequenceGapMs: SEQUENCE_GAP_MS,
        onActionStart: (action) => setStage(getStageLabel(action)),
      });
    };

    const run = async () => {
      await runOnce();

      while (!signal.aborted && getIsLooping()) {
        await new Promise((resolve) => setTimeout(resolve, LOOP_GAP_MS));
        if (!signal.aborted) await runOnce();
      }

      if (signal.aborted) return;

      setRunning(null);
      setStage(null);
    };

    void run();

    return () => controller.abort();
  }, [running]);

  /*
  타임라인은 서버 ID로 노드를 가리키므로, 재생을 누른 순간의 트리로 편집기 노드 ID로 바꾼다.
  */
  const play = (animation: LectureAnimation) => {
    const editorAnimation = getEditorLectureAnimation(
      animation,
      createLectureNodeIdResolver(useTreeStore.getState().nodes),
    );

    if (editorAnimation !== null) setRunning({ animation: editorAnimation });
  };

  const stop = () => {
    setRunning(null);
    setStage(null);
    useLectureAnimationStore.getState().resetVisual();
  };

  return { play, stop, isPlaying: running !== null, stage };
};
