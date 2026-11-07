import { getAncestorClientIds } from "../../lib/getAncestorClientIds";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import {
  type CustomEditorEdge,
  type CustomEditorNode,
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

const getTraceEdgeKeys = (clientIds: string[]): string[] =>
  clientIds
    .slice(1)
    .map((targetClientId, index) =>
      getLectureEdgeKey(clientIds[index], targetClientId),
    );

const runProgressiveTrace = async (
  layerId: string,
  edgeKeys: string[],
  direction: "forward" | "reverse",
  durationMs: number,
  signal: AbortSignal | undefined,
): Promise<boolean> => {
  const orderedEdgeKeys =
    direction === "reverse" ? [...edgeKeys].reverse() : edgeKeys;
  const visibleEdgeKeys = new Set<string>();
  const stepDurationMs =
    edgeKeys.length === 0 ? durationMs : durationMs / edgeKeys.length;

  for (const edgeKey of orderedEdgeKeys) {
    if (signal?.aborted) return false;
    visibleEdgeKeys.add(edgeKey);
    useLectureAnimationStore.getState().setLayer({
      id: layerId,
      type: "trace",
      edgeKeys: new Set(visibleEdgeKeys),
      direction,
    });

    const completed = await waitForLectureAnimation(stepDurationMs, signal);
    if (!completed) return false;
  }

  return true;
};

/*
함수 이름 : createLectureVisualLayer
기능 : 시각 효과 동작으로 표시할 레이어를 만든다.
인자 : Extract<EditorLectureAnimationAction, { type: "highlight" | "dim" | "trace" }> animation -> 시각 효과 동작
반환값 : 새 레이어
*/
export const createLectureVisualLayer = (
  animation: Extract<
    EditorLectureAnimationAction,
    { type: "highlight" | "dim" | "trace" }
  >,
): LectureVisualLayer => {
  const id = createLayerId();

  switch (animation.type) {
    case "highlight":
      return {
        id,
        type: animation.type,
        clientIds: new Set(animation.targetClientIds),
        style: animation.style,
        tone: animation.tone ?? "accent",
        motionDurationMs: animation.persist ? null : animation.durationMs,
      };
    case "dim":
      return {
        id,
        type: animation.type,
        exceptClientIds: new Set(animation.exceptClientIds),
      };
    case "trace":
      return {
        id,
        type: animation.type,
        edgeKeys: new Set(getTraceEdgeKeys(animation.clientIds)),
        direction: animation.direction ?? "forward",
      };
  }
};

/*
함수 이름 : getLectureCollapseServerIds
기능 : 접거나 펼칠 노드의 serverId를 구한다. 접을 때는 자식이 없는 노드를 빼고, 펼칠 때는 접힌 조상까지 넣어 대상이 화면에 드러나게 한다.
인자 : "collapse" | "expand" type -> 접을지 펼칠지
string[] targetClientIds -> 대상 노드의 clientId 목록
CustomEditorNode[] nodes -> 트리의 노드 목록
CustomEditorEdge[] edges -> 트리의 엣지 목록
반환값 : 바꿀 노드의 serverId 목록

접힘 상태는 serverId로 저장되므로 바꿔 넘기고, serverId가 없는 노드는 건너뛴다.
*/
export const getLectureCollapseServerIds = (
  type: "collapse" | "expand",
  targetClientIds: string[],
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): string[] => {
  const clientIds = new Set(
    type === "collapse"
      ? targetClientIds.filter((clientId) =>
          edges.some((edge) => edge.source === clientId),
        )
      : targetClientIds.flatMap((clientId) => [
          clientId,
          ...getAncestorClientIds(edges, clientId),
        ]),
  );

  return nodes.flatMap((node) =>
    clientIds.has(node.id) && node.data.serverId !== null
      ? [node.data.serverId]
      : [],
  );
};

/*
함수 이름 : applyLectureCollapse
기능 : 대상 노드를 접거나 펼친다.
인자 : "collapse" | "expand" type -> 접을지 펼칠지
string[] targetClientIds -> 대상 노드의 clientId 목록
반환값 : 없음
*/
const applyLectureCollapse = (
  type: "collapse" | "expand",
  targetClientIds: string[],
): void => {
  const { treeId, nodes, edges } = useTreeStore.getState();

  if (treeId === null) return;

  const serverIds = getLectureCollapseServerIds(
    type,
    targetClientIds,
    nodes,
    edges,
  );
  const { collapseAll, expandAll } = useCollapseStore.getState();

  if (type === "collapse") collapseAll(treeId, serverIds);
  else expandAll(treeId, serverIds);
};

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

  if (animation.type === "collapse" || animation.type === "expand") {
    applyLectureCollapse(animation.type, animation.targetClientIds);
    await waitForLectureAnimation(animation.durationMs, context.signal);
    return;
  }

  if (animation.type === "wait") {
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

  if (animation.type === "trace" && animation.mode === "progressive") {
    const layerId = createLayerId();
    const completed = await runProgressiveTrace(
      layerId,
      getTraceEdgeKeys(animation.clientIds),
      animation.direction ?? "forward",
      animation.durationMs,
      context.signal,
    );

    if (!animation.persist || !completed) {
      useLectureAnimationStore.getState().removeLayer(layerId);
    }
    return;
  }

  const layer = createLectureVisualLayer(animation);
  const layerId = layer.id;

  useLectureAnimationStore.getState().setLayer(layer);

  if ("persist" in animation && animation.persist) return;

  await waitForLectureAnimation(animation.durationMs, context.signal);
  useLectureAnimationStore.getState().removeLayer(layerId);
};

/*
함수 이름 : runLectureAnimation
기능 : 강의의 단위 동작과 순차·병렬 그룹을 재귀적으로 실행한다.
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
