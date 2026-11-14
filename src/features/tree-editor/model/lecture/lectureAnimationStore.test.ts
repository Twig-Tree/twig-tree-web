import { afterEach, describe, expect, it } from "vitest";
import {
  getLectureEdgeTraceDirection,
  getLectureEdgeTraceStyle,
  getLectureEdgeKey,
  getLectureNodeHighlightStyle,
  getLectureNodeHighlightTone,
  isLectureEdgeTraced,
  isLectureNodeDimmed,
  isLectureNodeHighlighted,
  isLectureNodePulsing,
  useLectureAnimationStore,
} from "./lectureAnimationStore";

afterEach(() => {
  useLectureAnimationStore.getState().resetVisual();
});

describe("lectureAnimationStore", () => {
  it("병렬 강조 레이어를 서로 덮어쓰지 않고 합쳐서 보여 준다", () => {
    const store = useLectureAnimationStore.getState();

    store.setLayer({
      id: "steady",
      type: "highlight",
      clientIds: new Set(["c1"]),
      style: "steady",
    });
    store.setLayer({
      id: "pulse",
      type: "highlight",
      clientIds: new Set(["c2"]),
      style: "bounce",
      tone: "success",
    });

    const state = useLectureAnimationStore.getState();
    expect(isLectureNodeHighlighted(state, "c1")).toBe(true);
    expect(isLectureNodeHighlighted(state, "c2")).toBe(true);
    expect(isLectureNodePulsing(state, "c1")).toBe(false);
    expect(isLectureNodePulsing(state, "c2")).toBe(false);
    expect(getLectureNodeHighlightStyle(state, "c2")).toBe("bounce");
    expect(getLectureNodeHighlightTone(state, "c2")).toBe("success");
  });

  it("dim 레이어의 예외 노드는 유지하고 나머지 노드만 흐리게 한다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "dim",
      type: "dim",
      exceptClientIds: new Set(["c1", "c2"]),
    });

    const state = useLectureAnimationStore.getState();
    expect(isLectureNodeDimmed(state, "c1")).toBe(false);
    expect(isLectureNodeDimmed(state, "c3")).toBe(true);
  });

  it("trace 레이어가 방향이 같은 연결선만 표시한다", () => {
    useLectureAnimationStore.getState().setLayer({
      id: "trace",
      type: "trace",
      edgeKeys: new Set([getLectureEdgeKey("c1", "c2")]),
      direction: "reverse",
    });

    const state = useLectureAnimationStore.getState();
    expect(isLectureEdgeTraced(state, "c1", "c2")).toBe(true);
    expect(isLectureEdgeTraced(state, "c2", "c1")).toBe(false);
    expect(getLectureEdgeTraceDirection(state, "c1", "c2")).toBe("reverse");
  });

  it("trace 모양을 고르지 않으면 점선으로, 고르면 마지막 레이어의 모양으로 표시한다", () => {
    const edgeKey = getLectureEdgeKey("c1", "c2");
    const store = useLectureAnimationStore.getState();

    expect(getLectureEdgeTraceStyle(store, "c1", "c2")).toBeNull();

    store.setLayer({ id: "dash", type: "trace", edgeKeys: new Set([edgeKey]) });
    expect(
      getLectureEdgeTraceStyle(useLectureAnimationStore.getState(), "c1", "c2"),
    ).toBe("dash");

    store.setLayer({
      id: "comet",
      type: "trace",
      edgeKeys: new Set([edgeKey]),
      style: "comet",
    });
    expect(
      getLectureEdgeTraceStyle(useLectureAnimationStore.getState(), "c1", "c2"),
    ).toBe("comet");
  });

  it("레이어 하나를 제거하거나 전체 시각 상태를 초기화한다", () => {
    const store = useLectureAnimationStore.getState();
    store.setLayer({
      id: "first",
      type: "highlight",
      clientIds: new Set(["c1"]),
      style: "steady",
    });
    store.setLayer({
      id: "second",
      type: "highlight",
      clientIds: new Set(["c2"]),
      style: "steady",
    });

    store.removeLayer("first");
    expect(useLectureAnimationStore.getState().layers.has("first")).toBe(false);
    expect(useLectureAnimationStore.getState().layers.has("second")).toBe(true);

    store.resetVisual();
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });
});
