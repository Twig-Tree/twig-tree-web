import { describe, expect, it } from "vitest";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import {
  type EditorLectureAnimation,
  type EditorLectureScript,
} from "../types";
import { getLectureSeekState } from "./getLectureSeekState";

/*
c1 ─ c2 ─ c3
   └ c4 ─ c5
*/
const nodes = [1, 2, 3, 4, 5].map((index) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: index,
    x: 0,
    y: 0,
  }),
);
const edges = [
  ["c1", "c2"],
  ["c2", "c3"],
  ["c1", "c4"],
  ["c4", "c5"],
].map(([sourceClientId, targetClientId]) =>
  createEditorEdge({ sourceClientId, targetClientId }),
);

const collapse = (id: string): EditorLectureAnimation => ({
  type: "collapse",
  targetClientIds: [id],
  durationMs: 800,
});
const expand = (id: string): EditorLectureAnimation => ({
  type: "expand",
  targetClientIds: [id],
  durationMs: 800,
});
const focus = (id: string): EditorLectureAnimation => ({
  type: "focus",
  targetClientIds: [id],
  maxZoom: 1,
  durationMs: 500,
});
const highlight = (id: string, persist: boolean): EditorLectureAnimation => ({
  type: "highlight",
  targetClientIds: [id],
  style: "steady",
  durationMs: 500,
  persist,
});

const createScript = (
  ...scenes: EditorLectureAnimation[][]
): EditorLectureScript => ({
  id: "script",
  title: "강의",
  scenes: scenes.map((animations, sceneIndex) => ({
    id: `scene-${sceneIndex}`,
    clientId: "c1",
    beats: animations.map((animation, beatIndex) => ({
      id: `beat-${sceneIndex}-${beatIndex}`,
      narration: { text: "", fallbackDurationMs: 1000 },
      animation,
    })),
  })),
});

const getState = (
  script: EditorLectureScript,
  sceneIndex: number,
  beatIndex: number,
  {
    isTargetBeatIncluded = false,
    isReducedMotion = false,
    base = [] as string[],
  } = {},
) =>
  getLectureSeekState({
    script,
    sceneIndex,
    beatIndex,
    isTargetBeatIncluded,
    isReducedMotion,
    nodes,
    edges,
    baseCollapsedServerIds: new Set(base),
  });

describe("getLectureSeekState", () => {
  it("장면을 넘어 앞선 동작의 접힘을 시작 상태에 쌓는다", () => {
    const script = createScript(
      [collapse("c2")],
      [collapse("c4"), expand("c2"), collapse("c1")],
    );

    expect([...getState(script, 1, 2).collapsedServerIds].sort()).toEqual([
      "s4",
    ]);
  });

  it("옮길 비트의 접힘은 넣지 않고, 일시정지면 넣는다", () => {
    const script = createScript([collapse("c2"), collapse("c4")]);

    expect([...getState(script, 0, 1).collapsedServerIds]).toEqual(["s2"]);
    expect(
      [
        ...getState(script, 0, 1, { isTargetBeatIncluded: true })
          .collapsedServerIds,
      ].sort(),
    ).toEqual(["s2", "s4"]);
  });

  it("강의를 시작할 때의 접힘에서 출발하고, focus는 대상의 조상을 펼친다", () => {
    const script = createScript([focus("c3"), collapse("c4")]);

    expect([
      ...getState(script, 0, 1, { base: ["s1", "s2", "s5"] })
        .collapsedServerIds,
    ]).toEqual(["s5"]);
  });

  it("focus는 대상 자신의 접힘을 풀지 않는다", () => {
    const script = createScript([focus("c2"), collapse("c4")]);

    expect([
      ...getState(script, 0, 1, { base: ["s1", "s2"] }).collapsedServerIds,
    ]).toEqual(["s2"]);
  });

  it("옮길 장면의 유지되는 강조만 남기고, 유지되지 않는 강조는 뺀다", () => {
    const script = createScript(
      [highlight("c1", true)],
      [highlight("c2", true), highlight("c3", false), focus("c1")],
    );

    const { layers } = getState(script, 1, 2);

    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({
      type: "highlight",
      clientIds: new Set(["c2"]),
    });
  });

  it("동작 줄이기를 켜면 재생과 같이 줄인 대본으로 되감는다", () => {
    const script = createScript([
      {
        type: "highlight",
        targetClientIds: ["c2"],
        style: "pulse",
        durationMs: 500,
        persist: true,
      },
      focus("c1"),
    ]);

    expect(getState(script, 0, 1).layers[0]).toMatchObject({
      style: "pulse",
    });
    expect(
      getState(script, 0, 1, { isReducedMotion: true }).layers[0],
    ).toMatchObject({ style: "steady" });
  });

  it("유지되는 dim은 레이어로 남기고, 유지되지 않는 dim은 뺀다", () => {
    const script = createScript([
      { type: "dim", exceptClientIds: ["c2"], durationMs: 500, persist: true },
      { type: "dim", exceptClientIds: ["c3"], durationMs: 500 },
      focus("c1"),
    ]);

    const { layers } = getState(script, 0, 2);

    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({
      type: "dim",
      exceptClientIds: new Set(["c2"]),
    });
  });

  it("병렬 그룹 안의 순차 동작은 재생과 같은 순서로 적용한다", () => {
    const script = createScript([
      {
        type: "group",
        mode: "parallel",
        children: [
          {
            type: "group",
            mode: "sequence",
            children: [focus("c5"), collapse("c2")],
          },
          expand("c2"),
        ],
      },
      focus("c1"),
    ]);

    expect([...getState(script, 0, 1).collapsedServerIds]).toEqual(["s2"]);
  });

  it("유지되는 progressive trace도 경로를 다 그린 뒤에 다음 동작이 시작한다", () => {
    const script = createScript([
      {
        type: "group",
        mode: "parallel",
        children: [
          {
            type: "group",
            mode: "sequence",
            children: [
              {
                type: "trace",
                clientIds: ["c1", "c2"],
                durationMs: 500,
                mode: "progressive",
                persist: true,
              },
              collapse("c2"),
            ],
          },
          {
            type: "group",
            mode: "sequence",
            children: [{ type: "wait", durationMs: 100 }, expand("c2")],
          },
        ],
      },
      focus("c1"),
    ]);

    expect([...getState(script, 0, 1).collapsedServerIds]).toEqual(["s2"]);
  });

  it("일시정지 중에는 옮길 비트의 유지되지 않는 연출도 보여 준다", () => {
    const script = createScript([
      highlight("c1", true),
      highlight("c2", false),
      {
        type: "trace",
        clientIds: ["c1", "c2"],
        durationMs: 500,
      },
    ]);
    const paused = getLectureSeekState({
      script,
      sceneIndex: 0,
      beatIndex: 1,
      isTargetBeatIncluded: true,
      isReducedMotion: false,
      nodes,
      edges,
      baseCollapsedServerIds: new Set(),
    });

    expect(paused.layers).toHaveLength(2);
    expect(paused.previewLayerIds).toEqual([paused.layers[1].id]);
  });

  it("reset은 범위에 맞게 강조와 카메라를 지운다", () => {
    const script = createScript([
      highlight("c1", true),
      focus("c2"),
      { type: "reset", scope: "visual" },
      collapse("c2"),
    ]);

    const { layers, camera } = getState(script, 0, 3);

    expect(layers).toEqual([]);
    expect(camera).toMatchObject({ type: "focus", clientIds: ["c2"] });

    const scriptWithCameraReset = createScript([
      focus("c2"),
      { type: "reset", scope: "camera" },
      collapse("c2"),
    ]);

    expect(getState(scriptWithCameraReset, 0, 2).camera).toEqual({
      type: "reset",
    });
  });

  it("앞선 카메라 동작이 없으면 카메라를 옮기지 않는다", () => {
    const script = createScript([collapse("c2"), collapse("c4")]);

    expect(getState(script, 0, 1).camera).toBeNull();
  });

  it("옮길 비트가 카메라로 시작하면 앞선 카메라로 옮기지 않는다", () => {
    const script = createScript([focus("c1"), focus("c2")]);

    expect(getState(script, 0, 1).camera).toBeNull();
    expect(
      getState(script, 0, 1, { isTargetBeatIncluded: true }).camera,
    ).toMatchObject({
      clientIds: ["c2"],
    });
  });

  it("옮길 비트가 다른 동작으로 시작하면 앞선 카메라로 옮긴다", () => {
    const script = createScript([
      focus("c1"),
      {
        type: "group",
        mode: "sequence",
        children: [collapse("c2"), focus("c2")],
      },
    ]);

    expect(getState(script, 0, 1).camera).toMatchObject({ clientIds: ["c1"] });
  });
});
