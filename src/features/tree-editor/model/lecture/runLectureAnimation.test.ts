import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EditorLectureAnimation } from "../types";
import {
  isLectureEdgeTraced,
  isLectureNodeDimmed,
  isLectureNodeHighlighted,
  useLectureAnimationStore,
} from "./lectureAnimationStore";
import { runLectureAnimation } from "./runLectureAnimation";

const revealNodes = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  revealNodes.mockReset();
  useLectureAnimationStore.getState().resetVisual();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runLectureAnimation", () => {
  it("sequence는 앞 동작이 끝난 뒤 다음 동작을 실행한다", async () => {
    const animation: EditorLectureAnimation = {
      type: "group",
      mode: "sequence",
      children: [
        {
          type: "focus",
          targetClientIds: ["c1", "c2"],
          maxZoom: 1.2,
          durationMs: 500,
        },
        {
          type: "highlight",
          targetClientIds: ["c2"],
          style: "steady",
          durationMs: 300,
        },
      ],
    };

    const completed = runLectureAnimation(animation, { revealNodes });

    expect(revealNodes).toHaveBeenCalledExactlyOnceWith(["c1", "c2"], {
      maxZoom: 1.2,
      duration: 500,
    });
    expect(
      isLectureNodeHighlighted(useLectureAnimationStore.getState(), "c2"),
    ).toBe(false);

    await vi.advanceTimersByTimeAsync(500);
    expect(
      isLectureNodeHighlighted(useLectureAnimationStore.getState(), "c2"),
    ).toBe(true);

    await vi.advanceTimersByTimeAsync(300);
    await completed;
    expect(
      isLectureNodeHighlighted(useLectureAnimationStore.getState(), "c2"),
    ).toBe(false);
  });

  it("sequence는 설정한 전환 간격 뒤에 다음 동작을 실행한다", async () => {
    const onActionStart = vi.fn();
    const animation: EditorLectureAnimation = {
      type: "group",
      mode: "sequence",
      children: [
        {
          type: "highlight",
          targetClientIds: ["c1"],
          style: "steady",
          durationMs: 300,
        },
        {
          type: "dim",
          exceptClientIds: ["c1"],
          durationMs: 300,
        },
      ],
    };

    const completed = runLectureAnimation(animation, {
      revealNodes,
      sequenceGapMs: 160,
      onActionStart,
    });

    expect(onActionStart).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(onActionStart).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(159);
    expect(onActionStart).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(onActionStart).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(300);
    await completed;
  });

  it("parallel은 여러 시각 동작을 동시에 적용한다", async () => {
    const animation: EditorLectureAnimation = {
      type: "group",
      mode: "parallel",
      children: [
        {
          type: "highlight",
          targetClientIds: ["c1"],
          style: "pulse",
          durationMs: 400,
        },
        {
          type: "dim",
          exceptClientIds: ["c1"],
          durationMs: 400,
        },
        {
          type: "trace",
          clientIds: ["c1", "c2", "c3"],
          durationMs: 400,
        },
      ],
    };

    const completed = runLectureAnimation(animation, { revealNodes });
    const state = useLectureAnimationStore.getState();

    expect(isLectureNodeHighlighted(state, "c1")).toBe(true);
    expect(isLectureNodeDimmed(state, "c2")).toBe(true);
    expect(isLectureEdgeTraced(state, "c1", "c2")).toBe(true);
    expect(isLectureEdgeTraced(state, "c2", "c3")).toBe(true);

    await vi.advanceTimersByTimeAsync(400);
    await completed;
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });

  it("persist 동작은 시간이 지나도 유지하고 reset이 제거한다", async () => {
    await runLectureAnimation(
      {
        type: "highlight",
        targetClientIds: ["c1"],
        style: "steady",
        durationMs: 300,
        persist: true,
      },
      { revealNodes },
    );

    await vi.advanceTimersByTimeAsync(300);
    expect(
      isLectureNodeHighlighted(useLectureAnimationStore.getState(), "c1"),
    ).toBe(true);

    await runLectureAnimation(
      { type: "reset", scope: "visual" },
      { revealNodes },
    );
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });

  it("중단되면 대기 중인 효과를 지우고 다음 순차 동작을 실행하지 않는다", async () => {
    const controller = new AbortController();
    const animation: EditorLectureAnimation = {
      type: "group",
      mode: "sequence",
      children: [
        {
          type: "highlight",
          targetClientIds: ["c1"],
          style: "steady",
          durationMs: 1000,
        },
        {
          type: "focus",
          targetClientIds: ["c2"],
          maxZoom: 1,
          durationMs: 500,
        },
      ],
    };

    const completed = runLectureAnimation(animation, {
      revealNodes,
      signal: controller.signal,
    });
    controller.abort();
    await completed;

    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
    expect(revealNodes).not.toHaveBeenCalled();
  });

  it("camera reset은 제공된 카메라 초기화 함수를 호출한다", async () => {
    const resetCamera = vi.fn();

    await runLectureAnimation(
      { type: "reset", scope: "camera" },
      { revealNodes, resetCamera },
    );

    expect(resetCamera).toHaveBeenCalledOnce();
  });
});
