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
  { isTargetBeatIncluded = false, base = [] as string[] } = {},
) =>
  getLectureSeekState({
    script,
    sceneIndex,
    beatIndex,
    isTargetBeatIncluded,
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
