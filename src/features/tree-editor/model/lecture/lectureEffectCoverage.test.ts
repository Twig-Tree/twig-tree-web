import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LECTURE_EFFECT_TYPES,
  type LectureAnimationAction,
  type LectureEffectType,
} from "@/src/entities/lecture";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { createLectureNodeIdResolver } from "../../lib/lecture/createLectureNodeIdResolver";
import { getEditorLectureAnimation } from "../../lib/lecture/getEditorLectureScript";
import {
  type EditorLectureAnimationAction,
  type EditorLectureScript,
} from "../types";
import { getLectureSeekState } from "./getLectureSeekState";
import { useLectureAnimationStore } from "./lectureAnimationStore";
import { runLectureAnimation } from "./runLectureAnimation";

/*
registry에 등록된 모든 동작이 편집기 변환, 실행기, 되감기를 빠짐없이 지나는지 확인한다.
동작 종류별 세부 동작은 각 모듈의 테스트가 맡고, 여기서는 누락만 본다.
*/

const nodes = [1, 2, 3].map((index) =>
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
  createEditorEdge({ sourceClientId: "c1", targetClientId: "c2" }),
  createEditorEdge({ sourceClientId: "c2", targetClientId: "c3" }),
];

/*
Record라서 동작 종류를 추가하면 예시도 채워야 한다.
*/
const SAMPLE_ACTIONS: { [T in LectureEffectType]: LectureAnimationAction } = {
  focus: { type: "focus", targetNodeIds: ["s2"], maxZoom: 1, durationMs: 300 },
  highlight: {
    type: "highlight",
    targetNodeIds: ["s2"],
    style: "pulse",
    durationMs: 300,
  },
  dim: { type: "dim", exceptNodeIds: ["s2"], durationMs: 300 },
  trace: { type: "trace", nodeIds: ["s1", "s2", "s3"], durationMs: 300 },
  wait: { type: "wait", durationMs: 300 },
  collapse: { type: "collapse", targetNodeIds: ["s2"], durationMs: 300 },
  expand: { type: "expand", targetNodeIds: ["s2"], durationMs: 300 },
  reset: { type: "reset", scope: "all" },
};

/*
SAMPLE_ACTIONS를 편집기 동작으로 바꾼 기대값. 노드 필드만 편집기 이름과 clientId로 바뀌고 나머지 옵션은 그대로다.
*/
const EXPECTED_EDITOR_ACTIONS: {
  [T in LectureEffectType]: EditorLectureAnimationAction;
} = {
  focus: {
    type: "focus",
    targetClientIds: ["c2"],
    maxZoom: 1,
    durationMs: 300,
  },
  highlight: {
    type: "highlight",
    targetClientIds: ["c2"],
    style: "pulse",
    durationMs: 300,
  },
  dim: { type: "dim", exceptClientIds: ["c2"], durationMs: 300 },
  trace: { type: "trace", clientIds: ["c1", "c2", "c3"], durationMs: 300 },
  wait: { type: "wait", durationMs: 300 },
  collapse: { type: "collapse", targetClientIds: ["c2"], durationMs: 300 },
  expand: { type: "expand", targetClientIds: ["c2"], durationMs: 300 },
  reset: { type: "reset", scope: "all" },
};

const getEditorAction = (type: LectureEffectType) => {
  const editorAction = getEditorLectureAnimation(
    SAMPLE_ACTIONS[type],
    createLectureNodeIdResolver(nodes),
  );

  if (editorAction === null || editorAction.type === "group") {
    throw new Error(`${type}을 편집기 동작으로 바꾸지 못했습니다.`);
  }

  return editorAction;
};

beforeEach(() => {
  vi.useFakeTimers();
  useLectureAnimationStore.getState().resetVisual();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("등록된 모든 동작", () => {
  it.each(LECTURE_EFFECT_TYPES)(
    "%s의 노드 ID를 편집기 clientId로 옮긴다",
    (type) => {
      expect(getEditorAction(type)).toEqual(EXPECTED_EDITOR_ACTIONS[type]);
    },
  );

  it.each(LECTURE_EFFECT_TYPES)(
    "%s를 실행기가 끝까지 실행하고 유지하지 않는 효과를 남기지 않는다",
    async (type) => {
      const revealNodes = vi.fn();
      const resetCamera = vi.fn();
      let isCompleted = false;

      void runLectureAnimation(getEditorAction(type), {
        revealNodes,
        resetCamera,
      }).then(() => {
        isCompleted = true;
      });
      await vi.advanceTimersByTimeAsync(1000);

      expect(isCompleted).toBe(true);
      expect(useLectureAnimationStore.getState().layers.size).toBe(0);
    },
  );

  it("되감기가 모든 동작을 지나 시작 상태를 만든다", () => {
    const script: EditorLectureScript = {
      id: "coverage",
      title: "모든 동작",
      scenes: [
        {
          id: "scene",
          clientId: "c1",
          beats: [...LECTURE_EFFECT_TYPES, "wait" as const].map((type) => ({
            id: `beat-${type}`,
            narration: { text: "", fallbackDurationMs: 100 },
            animation: getEditorAction(type),
          })),
        },
      ],
    };

    expect(() =>
      getLectureSeekState({
        script,
        sceneIndex: 0,
        beatIndex: LECTURE_EFFECT_TYPES.length,
        isTargetBeatIncluded: false,
        nodes,
        edges,
        baseCollapsedServerIds: new Set(),
      }),
    ).not.toThrow();
  });
});
