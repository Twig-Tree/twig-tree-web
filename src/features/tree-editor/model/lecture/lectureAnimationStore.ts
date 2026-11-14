import { create } from "zustand";

export type LectureVisualLayer =
  | {
      id: string;
      type: "highlight";
      clientIds: ReadonlySet<string>;
      style: "steady" | "pulse" | "pop" | "bounce" | "shake";
      tone?: "accent" | "success" | "warning" | "danger";
      motionDurationMs?: number | null; // 반복 움직임을 끝낼 시간. 유지되는 강조는 null
    }
  | {
      id: string;
      type: "dim";
      exceptClientIds: ReadonlySet<string>;
    }
  | {
      id: string;
      type: "trace";
      edgeKeys: ReadonlySet<string>;
      direction?: "forward" | "reverse";
      style?: "dash" | "comet";
    }
  | {
      id: string;
      type: "badge";
      clientIds: ReadonlySet<string>;
      label: string;
      tone: "accent" | "success" | "warning" | "danger";
    };

interface LectureAnimationState {
  layers: ReadonlyMap<string, LectureVisualLayer>;
  setLayer: (layer: LectureVisualLayer) => void;
  removeLayer: (layerId: string) => void;
  resetVisual: () => void;
}

const initialState = {
  layers: new Map<string, LectureVisualLayer>(),
};

/*
함수 이름 : getLectureEdgeKey
기능 : 연결선의 양 끝 clientId를 시각 레이어에서 비교할 수 있는 안정적인 키로 만든다.
인자 : string sourceClientId -> 연결선의 시작 노드 ID
string targetClientId -> 연결선의 끝 노드 ID
반환값 : 연결선 시각 상태 키
*/
export const getLectureEdgeKey = (
  sourceClientId: string,
  targetClientId: string,
): string => JSON.stringify([sourceClientId, targetClientId]);

/*
여러 병렬 동작이 같은 종류의 효과를 동시에 적용해도 서로 덮어쓰지 않도록 동작마다 독립된 레이어를 둔다.
*/
export const useLectureAnimationStore = create<LectureAnimationState>()(
  (set) => ({
    ...initialState,
    setLayer: (layer) =>
      set((state) => ({
        layers: new Map(state.layers).set(layer.id, layer),
      })),
    removeLayer: (layerId) =>
      set((state) => {
        if (!state.layers.has(layerId)) return state;

        const layers = new Map(state.layers);
        layers.delete(layerId);
        return { layers };
      }),
    resetVisual: () => set(initialState),
  }),
);

export const isLectureNodeHighlighted = (
  state: LectureAnimationState,
  clientId: string,
): boolean =>
  [...state.layers.values()].some(
    (layer) => layer.type === "highlight" && layer.clientIds.has(clientId),
  );

export const isLectureNodePulsing = (
  state: LectureAnimationState,
  clientId: string,
): boolean =>
  [...state.layers.values()].some(
    (layer) =>
      layer.type === "highlight" &&
      layer.style === "pulse" &&
      layer.clientIds.has(clientId),
  );

export const getLectureNodeHighlightStyle = (
  state: LectureAnimationState,
  clientId: string,
): "steady" | "pulse" | "pop" | "bounce" | "shake" | null => {
  const layers = [...state.layers.values()].reverse();
  const layer = layers.find(
    (candidate) =>
      candidate.type === "highlight" && candidate.clientIds.has(clientId),
  );

  return layer?.type === "highlight" ? layer.style : null;
};

export const getLectureNodeHighlightTone = (
  state: LectureAnimationState,
  clientId: string,
): "accent" | "success" | "warning" | "danger" | null => {
  const layers = [...state.layers.values()].reverse();
  const layer = layers.find(
    (candidate) =>
      candidate.type === "highlight" && candidate.clientIds.has(clientId),
  );

  return layer?.type === "highlight" ? (layer.tone ?? "accent") : null;
};

export const getLectureNodeHighlightMotionDuration = (
  state: LectureAnimationState,
  clientId: string,
): number | null => {
  const layers = [...state.layers.values()].reverse();
  const layer = layers.find(
    (candidate) =>
      candidate.type === "highlight" && candidate.clientIds.has(clientId),
  );

  return layer?.type === "highlight" ? (layer.motionDurationMs ?? null) : null;
};

export const isLectureNodeDimmed = (
  state: LectureAnimationState,
  clientId: string,
): boolean =>
  [...state.layers.values()].some(
    (layer) => layer.type === "dim" && !layer.exceptClientIds.has(clientId),
  );

export const isLectureEdgeTraced = (
  state: LectureAnimationState,
  sourceClientId: string,
  targetClientId: string,
): boolean => {
  const edgeKey = getLectureEdgeKey(sourceClientId, targetClientId);

  return [...state.layers.values()].some(
    (layer) => layer.type === "trace" && layer.edgeKeys.has(edgeKey),
  );
};

export const getLectureEdgeTraceDirection = (
  state: LectureAnimationState,
  sourceClientId: string,
  targetClientId: string,
): "forward" | "reverse" | null => {
  const edgeKey = getLectureEdgeKey(sourceClientId, targetClientId);
  const layers = [...state.layers.values()].reverse();
  const layer = layers.find(
    (candidate) =>
      candidate.type === "trace" && candidate.edgeKeys.has(edgeKey),
  );

  return layer?.type === "trace" ? (layer.direction ?? "forward") : null;
};

export const getLectureEdgeTraceStyle = (
  state: LectureAnimationState,
  sourceClientId: string,
  targetClientId: string,
): "dash" | "comet" | null => {
  const edgeKey = getLectureEdgeKey(sourceClientId, targetClientId);
  const layers = [...state.layers.values()].reverse();
  const layer = layers.find(
    (candidate) =>
      candidate.type === "trace" && candidate.edgeKeys.has(edgeKey),
  );

  return layer?.type === "trace" ? (layer.style ?? "dash") : null;
};

/*
함수 이름 : getLectureNodeBadge
기능 : 노드에 붙은 강의 꼬리표를 찾는다. 여럿이면 나중에 붙인 꼬리표를 쓴다.
인자 : LectureAnimationState state -> 강의 시각 상태
string clientId -> 노드의 clientId
반환값 : 꼬리표 레이어. store에 있는 객체를 그대로 돌려주므로 selector로 구독해도 매번 새 값이 되지 않는다. 없으면 null
*/
export const getLectureNodeBadge = (
  state: LectureAnimationState,
  clientId: string,
): Extract<LectureVisualLayer, { type: "badge" }> | null => {
  const layers = [...state.layers.values()].reverse();
  const layer = layers.find(
    (candidate) =>
      candidate.type === "badge" && candidate.clientIds.has(clientId),
  );

  return layer?.type === "badge" ? layer : null;
};
