import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";
import { type EditorLectureAnimation } from "../types";
import {
  getLectureEdgeTraceStyle,
  getLectureNodeGrowState,
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

  it("wait는 시각 상태를 바꾸지 않고 지정한 시간만 기다린다", async () => {
    let isCompleted = false;
    void runLectureAnimation(
      { type: "wait", durationMs: 500 },
      { revealNodes },
    ).then(() => {
      isCompleted = true;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(isCompleted).toBe(false);
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(isCompleted).toBe(true);
  });

  it("progressive trace는 연결선을 진행 방향에 맞춰 하나씩 추가한다", async () => {
    const completed = runLectureAnimation(
      {
        type: "trace",
        clientIds: ["c1", "c2", "c3"],
        durationMs: 1000,
        mode: "progressive",
        direction: "reverse",
      },
      { revealNodes },
    );

    let state = useLectureAnimationStore.getState();
    expect(isLectureEdgeTraced(state, "c1", "c2")).toBe(false);
    expect(isLectureEdgeTraced(state, "c2", "c3")).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    state = useLectureAnimationStore.getState();
    expect(isLectureEdgeTraced(state, "c1", "c2")).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    await completed;
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });

  it("persist progressive trace는 진행을 마친 뒤 경로를 유지한다", async () => {
    const completed = runLectureAnimation(
      {
        type: "trace",
        clientIds: ["c1", "c2"],
        durationMs: 300,
        mode: "progressive",
        persist: true,
      },
      { revealNodes },
    );

    await vi.advanceTimersByTimeAsync(300);
    await completed;
    expect(
      isLectureEdgeTraced(useLectureAnimationStore.getState(), "c1", "c2"),
    ).toBe(true);
  });

  it("trace 모양을 동시·순차 추적 모두 레이어에 넘긴다", async () => {
    void runLectureAnimation(
      {
        type: "trace",
        clientIds: ["c1", "c2"],
        durationMs: 300,
        style: "comet",
        persist: true,
      },
      { revealNodes },
    );
    void runLectureAnimation(
      {
        type: "trace",
        clientIds: ["c2", "c3"],
        durationMs: 300,
        mode: "progressive",
        style: "comet",
        persist: true,
      },
      { revealNodes },
    );

    const state = useLectureAnimationStore.getState();
    expect(getLectureEdgeTraceStyle(state, "c1", "c2")).toBe("comet");
    expect(getLectureEdgeTraceStyle(state, "c2", "c3")).toBe("comet");
  });
});

describe("runLectureAnimation 접기와 펼치기", () => {
  /*
  root ─ parent ─ leaf
  */
  beforeEach(() => {
    const createNode = (clientId: string, orderIndex: number) =>
      createEditorNode({
        clientId,
        serverId: `s-${clientId}`,
        label: clientId,
        orderIndex,
        x: 0,
        y: 0,
      });

    useCollapseStore.getState().resetCollapse();
    useTreeStore.setState({
      treeId: "t1",
      nodes: [
        createNode("root", 0),
        createNode("parent", 1),
        createNode("leaf", 2),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "root", targetClientId: "parent" }),
        createEditorEdge({ sourceClientId: "parent", targetClientId: "leaf" }),
      ],
    });
  });

  const getCollapsed = () => [
    ...useCollapseStore.getState().collapsedServerIds,
  ];

  it("collapse는 대상을 접고, 자식이 없는 노드는 건너뛰고, durationMs를 기다린다", async () => {
    let isCompleted = false;

    void runLectureAnimation(
      {
        type: "collapse",
        targetClientIds: ["parent", "leaf"],
        durationMs: 800,
      },
      { revealNodes },
    ).then(() => {
      isCompleted = true;
    });

    expect(getCollapsed()).toEqual(["s-parent"]);

    await vi.advanceTimersByTimeAsync(799);
    expect(isCompleted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(isCompleted).toBe(true);
  });

  it("expand는 대상과 접힌 조상을 함께 펼친다", async () => {
    useCollapseStore.getState().collapseAll("t1", ["s-root", "s-parent"]);

    const completed = runLectureAnimation(
      { type: "expand", targetClientIds: ["parent"], durationMs: 0 },
      { revealNodes },
    );

    expect(getCollapsed()).toEqual([]);

    await vi.advanceTimersByTimeAsync(0);
    await completed;
  });

  it("이미 중단된 실행은 접힘을 바꾸지 않는다", async () => {
    const controller = new AbortController();
    controller.abort();

    await runLectureAnimation(
      { type: "collapse", targetClientIds: ["parent"], durationMs: 800 },
      { revealNodes, signal: controller.signal },
    );

    expect(getCollapsed()).toEqual([]);
  });
});

describe("runLectureAnimation grow", () => {
  /*
  root ─ parent ─ leaf
  */
  beforeEach(() => {
    const createNode = (clientId: string, orderIndex: number) =>
      createEditorNode({
        clientId,
        serverId: `s-${clientId}`,
        label: clientId,
        orderIndex,
        x: 0,
        y: 0,
      });

    useCollapseStore.getState().resetCollapse();
    useTreeStore.setState({
      treeId: "t1",
      nodes: [
        createNode("root", 0),
        createNode("parent", 1),
        createNode("leaf", 2),
      ],
      edges: [
        createEditorEdge({ sourceClientId: "root", targetClientId: "parent" }),
        createEditorEdge({ sourceClientId: "parent", targetClientId: "leaf" }),
      ],
    });
  });

  const getGrowState = (clientId: string) =>
    getLectureNodeGrowState(useLectureAnimationStore.getState(), clientId);

  it("자손을 숨긴 채 시작해 깊이마다 한 칸씩 드러내고, 마지막 칸이 끝나면 모두 보인다", async () => {
    let isCompleted = false;

    void runLectureAnimation(
      { type: "grow", targetClientIds: ["root"], durationMs: 900 },
      { revealNodes },
    ).then(() => {
      isCompleted = true;
    });

    expect(getGrowState("root")).toBeNull();
    expect(getGrowState("parent")).toBe("hidden");
    expect(getGrowState("leaf")).toBe("hidden");

    await vi.advanceTimersByTimeAsync(300);
    expect(getGrowState("parent")).toBe("entering");
    expect(getGrowState("leaf")).toBe("hidden");

    await vi.advanceTimersByTimeAsync(300);
    expect(getGrowState("parent")).toBeNull();
    expect(getGrowState("leaf")).toBe("entering");

    await vi.advanceTimersByTimeAsync(300);
    expect(isCompleted).toBe(true);
    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });

  it("접혀서 화면에 없는 자손은 드러낼 단계에 넣지 않는다", async () => {
    useCollapseStore.getState().collapseAll("t1", ["s-parent"]);

    void runLectureAnimation(
      { type: "grow", targetClientIds: ["root"], durationMs: 600 },
      { revealNodes },
    );

    expect(getGrowState("parent")).toBe("hidden");
    expect(getGrowState("leaf")).toBeNull();

    await vi.advanceTimersByTimeAsync(300);
    expect(getGrowState("parent")).toBe("entering");
  });

  it("중단하면 숨긴 자손을 바로 되돌린다", async () => {
    const controller = new AbortController();
    const completed = runLectureAnimation(
      { type: "grow", targetClientIds: ["root"], durationMs: 900 },
      { revealNodes, signal: controller.signal },
    );

    expect(getGrowState("leaf")).toBe("hidden");

    controller.abort();
    await completed;

    expect(useLectureAnimationStore.getState().layers.size).toBe(0);
  });
});
