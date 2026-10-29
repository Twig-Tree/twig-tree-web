import {
  type EditorLectureAnimation,
  type EditorLectureAnimationAction,
} from "../types";
import {
  getLectureEdgeKey,
  type LectureVisualLayer,
  useLectureAnimationStore,
} from "./lectureAnimationStore";

type RunLectureAnimationContext = {
  revealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // 접힌 조상을 펼치고 대상 노드로 카메라를 이동한다
  resetCamera?: () => void; // 카메라를 강의 시작 전 상태로 되돌린다
  signal?: AbortSignal; // 중단되면 대기 중인 동작과 이후 조합을 실행하지 않는다
  sequenceGapMs?: number; // 순차 그룹의 동작 사이에 둘 전환 간격
  onActionStart?: (animation: EditorLectureAnimationAction) => void; // 단위 동작이 시작될 때 현재 단계를 알린다
  onActionEnd?: (animation: EditorLectureAnimationAction) => void; // 단위 동작이 끝날 때 전환 상태를 알린다
};

let nextLayerId = 0;

const createLayerId = (): string => {
  nextLayerId += 1;
  return `lecture-animation-${nextLayerId}`;
};

/*
함수 이름 : waitForLectureAnimation
기능 : 단위 동작의 표시 시간을 기다리되 실행 신호가 중단되면 즉시 끝낸다.
인자 : number durationMs -> 기다릴 시간
AbortSignal | undefined signal -> 실행 중단 신호
반환값 : 시간을 모두 기다렸으면 true, 중단되었으면 false
*/
const waitForLectureAnimation = (
  durationMs: number,
  signal: AbortSignal | undefined,
): Promise<boolean> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      resolve(false);
    };
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve(true);
    }, durationMs);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });

const getTraceEdgeKeys = (clientIds: string[]): Set<string> =>
  new Set(
    clientIds
      .slice(1)
      .map((targetClientId, index) =>
        getLectureEdgeKey(clientIds[index], targetClientId),
      ),
  );

/*
함수 이름 : runLectureAnimationAction
기능 : 단위 동작 하나를 실행하고 지속하지 않는 시각 효과는 표시 시간이 끝난 뒤 제거한다.
인자 : EditorLectureAnimation animation -> 실행할 단위 동작
RunLectureAnimationContext context -> 카메라 동작과 중단 신호
반환값 : 단위 동작이 끝날 때 완료되는 Promise
*/
const runLectureAnimationAction = async (
  animation: Exclude<EditorLectureAnimation, { type: "group" }>,
  context: RunLectureAnimationContext,
): Promise<void> => {
  if (context.signal?.aborted) return;

  if (animation.type === "focus") {
    context.revealNodes(animation.targetClientIds, {
      maxZoom: animation.maxZoom,
      duration: animation.durationMs,
    });
    await waitForLectureAnimation(animation.durationMs, context.signal);
    return;
  }

  if (animation.type === "reset") {
    if (animation.scope === "visual" || animation.scope === "all") {
      useLectureAnimationStore.getState().resetVisual();
    }
    if (animation.scope === "camera" || animation.scope === "all") {
      context.resetCamera?.();
    }
    return;
  }

  const layerId = createLayerId();
  let layer: LectureVisualLayer;

  switch (animation.type) {
    case "highlight":
      layer = {
        id: layerId,
        type: animation.type,
        clientIds: new Set(animation.targetClientIds),
        style: animation.style,
      };
      break;
    case "dim":
      layer = {
        id: layerId,
        type: animation.type,
        exceptClientIds: new Set(animation.exceptClientIds),
      };
      break;
    case "trace":
      layer = {
        id: layerId,
        type: animation.type,
        edgeKeys: getTraceEdgeKeys(animation.clientIds),
      };
      break;
  }

  useLectureAnimationStore.getState().setLayer(layer);

  if ("persist" in animation && animation.persist) return;

  await waitForLectureAnimation(animation.durationMs, context.signal);
  useLectureAnimationStore.getState().removeLayer(layerId);
};

/*
함수 이름 : runLectureAnimation
기능 : 동적 강의의 단위 동작과 순차·병렬 그룹을 재귀적으로 실행한다.
인자 : EditorLectureAnimation animation -> 실행할 동작 트리
RunLectureAnimationContext context -> 카메라 동작과 중단 신호
반환값 : 동작 트리 전체가 끝날 때 완료되는 Promise
*/
export const runLectureAnimation = async (
  animation: EditorLectureAnimation,
  context: RunLectureAnimationContext,
): Promise<void> => {
  if (context.signal?.aborted) return;

  if (animation.type !== "group") {
    context.onActionStart?.(animation);
    await runLectureAnimationAction(animation, context);
    if (!context.signal?.aborted) context.onActionEnd?.(animation);
    return;
  }

  if (animation.mode === "parallel") {
    await Promise.all(
      animation.children.map((child) => runLectureAnimation(child, context)),
    );
    return;
  }

  for (const [index, child] of animation.children.entries()) {
    if (context.signal?.aborted) return;
    await runLectureAnimation(child, context);

    const hasNextChild = index < animation.children.length - 1;
    if (!hasNextChild || !context.sequenceGapMs) continue;

    const completed = await waitForLectureAnimation(
      context.sequenceGapMs,
      context.signal,
    );
    if (!completed) return;
  }
};
