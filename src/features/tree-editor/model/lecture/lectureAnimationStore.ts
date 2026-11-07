import { create } from "zustand";

export type LectureVisualLayer =
  | {
      id: string;
      type: "highlight";
      clientIds: ReadonlySet<string>;
      style: "steady" | "pulse";
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
