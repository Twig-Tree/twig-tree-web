// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOTION_DURATION_MS } from "../../constants/motion";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useCollapseStore } from "./collapseStore";
import { useNodeTransition } from "./useNodeTransition";

const TREE_ID = "1";

const createNode = (clientId: string, x: number, y: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x,
    y,
  });

let frameCallback: FrameRequestCallback | null = null;
let isLayoutRunning = false;
let startTime = 0;

/*
함수 이름 : runFrameAt
기능 : 전환을 시작한 시점으로부터 주어진 시간이 지난 프레임을 실행한다.
인자 : number elapsed -> 전환 시작 후 지난 시간(ms)
반환값 : 없음
*/
const runFrameAt = (elapsed: number) => {
  act(() => {
    const callback = frameCallback;

    frameCallback = null;
    callback?.(startTime + elapsed);
  });
};

/*
함수 이름 : renderTransition
기능 : 첫 노드 목록으로 hook을 그린다.
인자 : CustomEditorNode[] nodes -> 첫 노드 목록
반환값 : renderHook 결과
*/
const renderTransition = (nodes: ReturnType<typeof createNode>[]) =>
  renderHook(
    (props) =>
      useNodeTransition({
        nodes: props.nodes,
        isLayoutRunning: () => isLayoutRunning,
      }),
    { initialProps: { nodes } },
  );

/*
함수 이름 : toggleCollapse
기능 : 접힘을 바꾼다. 실제 화면처럼 레이아웃 계산이 시작된 상태로 둔다.
인자 : 없음
반환값 : 없음
*/
const toggleCollapse = () => {
  isLayoutRunning = true;
  act(() => useCollapseStore.getState().toggleCollapse(TREE_ID, "s-a"));
};

beforeEach(() => {
  frameCallback = null;
  isLayoutRunning = false;
  startTime = performance.now();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameCallback = callback;

    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    frameCallback = null;
  });
  vi.spyOn(performance, "now").mockImplementation(() => startTime);
  useCollapseStore.setState({ treeId: TREE_ID, collapsedServerIds: new Set() });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useCollapseStore.getState().resetCollapse();
});

describe("useNodeTransition", () => {
  it("접힘이 바뀌면 이전 좌표에서 시작해 최종 좌표로 끝난다", () => {
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    toggleCollapse();
    rerender({ nodes: [createNode("a", 0, 0)] });

    isLayoutRunning = false;
    rerender({ nodes: [createNode("a", 100, 0)] });

    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.transitionNodes[0].position).toEqual({ x: 0, y: 0 });

    runFrameAt(MOTION_DURATION_MS / 2);
    expect(result.current.transitionNodes[0].position.x).toBeCloseTo(50);

    runFrameAt(MOTION_DURATION_MS);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.transitionNodes[0].position).toEqual({
      x: 100,
      y: 0,
    });
  });

  it("전환 중에 다시 접으면 그리던 좌표에서 이어서 움직인다", () => {
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    toggleCollapse();
    isLayoutRunning = false;
    rerender({ nodes: [createNode("a", 100, 0)] });
    runFrameAt(MOTION_DURATION_MS / 2);

    toggleCollapse();
    isLayoutRunning = false;
    rerender({ nodes: [createNode("a", 0, 0)] });

    expect(result.current.transitionNodes[0].position.x).toBeCloseTo(50);
  });

  it("접힘이 그대로면 좌표가 바뀌어도 바로 옮긴다", () => {
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    rerender({ nodes: [createNode("a", 100, 0)] });

    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.transitionNodes[0].position.x).toBe(100);
  });

  it("움직일 노드가 없으면 전환 대기를 남기지 않아 다음 재배치에 전환이 걸리지 않는다", () => {
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    toggleCollapse();
    isLayoutRunning = false;
    rerender({ nodes: [createNode("a", 0, 0)] });
    rerender({ nodes: [createNode("a", 100, 0)] });

    expect(result.current.isTransitioning).toBe(false);
  });

  it("저장된 접힘을 복원할 때는 움직이지 않는다", () => {
    useCollapseStore.getState().resetCollapse();
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    act(() =>
      useCollapseStore.setState({
        treeId: TREE_ID,
        collapsedServerIds: new Set(["s-a"]),
      }),
    );
    rerender({ nodes: [createNode("a", 100, 0)] });

    expect(result.current.isTransitioning).toBe(false);
  });

  it("새로 나타난 노드는 낡은 좌표에서 출발하지 않는다", () => {
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    toggleCollapse();
    rerender({ nodes: [createNode("a", 0, 0), createNode("b", 999, 999)] });

    isLayoutRunning = false;
    rerender({ nodes: [createNode("a", 100, 0), createNode("b", 200, 0)] });

    expect(result.current.transitionNodes[1].position).toEqual({
      x: 200,
      y: 0,
    });
  });

  it("동작 줄이기를 켜면 움직이지 않는다", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { result, rerender } = renderTransition([createNode("a", 0, 0)]);

    toggleCollapse();
    isLayoutRunning = false;
    rerender({ nodes: [createNode("a", 100, 0)] });

    expect(result.current.isTransitioning).toBe(false);
  });
});
