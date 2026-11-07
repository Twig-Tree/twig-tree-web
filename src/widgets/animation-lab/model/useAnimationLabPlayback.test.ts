import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useLectureAnimationStore,
  useTreeStore,
  type CustomEditorNode,
} from "@/src/features/tree-editor";
import { type LectureAnimation } from "@/src/entities/lecture";
import { useAnimationLabPlayback } from "./useAnimationLabPlayback";

const node = {
  id: "client-1",
  type: "custom",
  position: { x: 0, y: 0 },
  data: { serverId: "1", label: "노드", orderIndex: 0, memo: null, tagIds: [] },
} as CustomEditorNode;

const highlight: LectureAnimation = {
  type: "highlight",
  targetNodeIds: ["1"],
  style: "pulse",
  durationMs: 1000,
};

const revealNodes = vi.fn();
const resetCamera = vi.fn();

const renderPlayback = (isLooping = false) =>
  renderHook(
    (props: { isLooping: boolean }) =>
      useAnimationLabPlayback({ revealNodes, resetCamera, ...props }),
    { initialProps: { isLooping } },
  );

const getLayerCount = () => useLectureAnimationStore.getState().layers.size;

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  revealNodes.mockReset();
  resetCamera.mockReset();
  useLectureAnimationStore.getState().resetVisual();
  useTreeStore
    .getState()
    .initializeTree({ treeId: "lab", nodes: [node], edges: [] });
});

afterEach(() => {
  vi.useRealTimers();
  useTreeStore.getState().resetTree();
});

describe("useAnimationLabPlayback", () => {
  it("서버 ID를 편집기 노드 ID로 바꿔 재생하고 끝나면 대기로 돌아간다", async () => {
    const { result } = renderPlayback();

    act(() => result.current.play(highlight));
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.stage).toBe("Camera reset");
    expect(resetCamera).toHaveBeenCalledTimes(1);
    expect(getLayerCount()).toBe(0);

    await advance(900);
    expect(result.current.stage).toBe("Pulse");
    expect(getLayerCount()).toBe(1);
    expect([...useLectureAnimationStore.getState().layers.values()]).toEqual([
      expect.objectContaining({
        type: "highlight",
        clientIds: new Set(["client-1"]),
      }),
    ]);

    await advance(1000);
    expect(result.current.stage).toBe("Camera reset");
    expect(resetCamera).toHaveBeenCalledTimes(2);
    expect(getLayerCount()).toBe(0);

    await advance(900);
    expect(result.current.isPlaying).toBe(false);
  });

  it("트리에 없는 노드를 가리키면 재생하지 않는다", () => {
    const { result } = renderPlayback();

    act(() => result.current.play({ ...highlight, targetNodeIds: ["999"] }));

    expect(result.current.isPlaying).toBe(false);
  });

  it("중단하면 효과를 지우고 이어서 실행하지 않는다", async () => {
    const { result } = renderPlayback();

    act(() =>
      result.current.play({
        type: "group",
        mode: "sequence",
        children: [highlight, highlight],
      }),
    );
    act(() => result.current.stop());

    expect(result.current.isPlaying).toBe(false);
    expect(getLayerCount()).toBe(0);
    expect(resetCamera).toHaveBeenCalledTimes(2);

    await advance(5000);
    expect(getLayerCount()).toBe(0);
  });

  it("반복을 켜면 끝난 뒤 다시 재생하고, 끄면 그 회차에서 멈춘다", async () => {
    const { result, rerender } = renderPlayback(true);

    act(() => result.current.play(highlight));
    await advance(2800);
    expect(result.current.isPlaying).toBe(true);

    await advance(1000);
    expect(resetCamera).toHaveBeenCalledTimes(3);
    await advance(900);
    expect(getLayerCount()).toBe(1);

    rerender({ isLooping: false });
    await advance(1000);
    await advance(900);
    expect(result.current.isPlaying).toBe(false);
  });

  it("접힌 노드가 펼쳐져 revealNodes가 바뀌어도 재생을 다시 시작하지 않는다", async () => {
    const nextRevealNodes = vi.fn();
    const { result, rerender } = renderHook(
      (props: { revealNodes: typeof revealNodes }) =>
        useAnimationLabPlayback({ resetCamera, isLooping: false, ...props }),
      { initialProps: { revealNodes } },
    );

    act(() =>
      result.current.play({
        type: "focus",
        targetNodeIds: ["1"],
        maxZoom: 1,
        durationMs: 1000,
      }),
    );
    expect(resetCamera).toHaveBeenCalledOnce();
    expect(revealNodes).not.toHaveBeenCalled();

    await advance(900);
    expect(revealNodes).toHaveBeenCalledOnce();

    rerender({ revealNodes: nextRevealNodes });
    expect(nextRevealNodes).not.toHaveBeenCalled();

    await advance(1000);
    await advance(900);
    expect(result.current.isPlaying).toBe(false);
  });
});
