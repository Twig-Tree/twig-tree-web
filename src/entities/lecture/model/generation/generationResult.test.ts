import { describe, expect, it } from "vitest";
import { createLectureCompilerTree } from "../compiler/createLectureCompilerTree";
import { TEST_COMPILER_TREE } from "../compiler/testTree";
import { LECTURE_SCENARIO_FIXTURES } from "../scenario/fixtures";
import { type LectureScenario } from "../scenario/types";
import { getLectureGenerationResult } from "./generationResult";

const USAGE = { inputTokens: 1200, outputTokens: 340 };
const OPTIONS = {
  scriptId: "script-1",
  tree: TEST_COMPILER_TREE,
  usage: USAGE,
};

const SCENARIO: LectureScenario = {
  scenarioSchemaVersion: 1,
  recipeRegistryVersion: 1,
  title: "정렬",
  scenes: [
    {
      id: "scene-1",
      nodeId: "1",
      beats: [
        {
          id: "beat-1",
          narration: { text: "정렬을 소개합니다." },
          cues: [{ intent: "introduce", roles: { subject: "1" } }],
        },
        {
          id: "beat-2",
          narration: { text: "하위 개념을 봅니다." },
          cues: [
            { intent: "decompose", roles: { parent: "1" } },
            { intent: "emphasize", roles: { subject: ["2"] } },
          ],
        },
      ],
    },
  ],
};

/*
함수 이름 : getScenarioWith
기능 : 기본 시나리오의 첫 비트 cue를 바꾼 응답 문자열을 만든다.
인자 : unknown cue -> 첫 비트에 넣을 cue
반환값 : 모델 응답 본문
*/
const getScenarioWith = (cue: unknown) =>
  JSON.stringify({
    ...SCENARIO,
    scenes: [
      {
        ...SCENARIO.scenes[0],
        beats: [{ ...SCENARIO.scenes[0].beats[0], cues: [cue] }],
      },
    ],
  });

describe("getLectureGenerationResult", () => {
  it("strict 응답의 null을 빼고 컴파일해 측정값과 함께 돌려준다", () => {
    const responseText = JSON.stringify({
      ...SCENARIO,
      scenes: [
        {
          ...SCENARIO.scenes[0],
          beats: [
            {
              ...SCENARIO.scenes[0].beats[0],
              cues: [
                {
                  intent: "introduce",
                  roles: { subject: "1", context: null },
                  delivery: null,
                },
              ],
            },
            SCENARIO.scenes[0].beats[1],
          ],
        },
      ],
    });

    const result = getLectureGenerationResult(responseText, OPTIONS);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.scenario).toEqual(SCENARIO);
    expect(result.script.scenes[0].beats.map(({ id }) => id)).toEqual([
      "beat-1",
      "beat-2",
    ]);
    expect(result.metrics).toEqual({
      issueCountByStage: {
        json: 0,
        schema: 0,
        node: 0,
        recipe: 0,
        composition: 0,
        duration: 0,
      },
      sceneCount: 1,
      beatCount: 2,
      cueCount: 3,
      usage: USAGE,
    });
  });

  it("JSON이 아니면 json 단계에서 멈추고 셀 수 없는 값은 null이다", () => {
    const result = getLectureGenerationResult('{"title": "잘린 응답', OPTIONS);

    expect(result).toMatchObject({
      success: false,
      failedStep: "json",
      issues: [{ severity: "error", stage: "json", path: [] }],
      metrics: {
        issueCountByStage: { json: 1 },
        sceneCount: null,
        beatCount: null,
        cueCount: null,
        usage: USAGE,
      },
    });
  });

  it("스키마를 어기면 schema 단계에서 멈춘다", () => {
    const result = getLectureGenerationResult(
      getScenarioWith({ intent: "introduce", roles: { subject: "" } }),
      { ...OPTIONS, usage: null },
    );

    expect(result).toMatchObject({
      success: false,
      failedStep: "schema",
      metrics: { sceneCount: null, usage: null },
    });
    if (result.success) return;
    expect(result.issues.every(({ stage }) => stage === "schema")).toBe(true);
    expect(result.metrics.issueCountByStage.schema).toBe(result.issues.length);
  });

  it("트리와 맞지 않으면 compile 단계에서 멈추고 시나리오 수는 센다", () => {
    const result = getLectureGenerationResult(
      getScenarioWith({ intent: "introduce", roles: { subject: "999" } }),
      OPTIONS,
    );

    expect(result).toMatchObject({
      success: false,
      failedStep: "compile",
      issues: [
        {
          stage: "node",
          path: ["scenes", 0, "beats", 0, "cues", 0, "roles", "subject"],
        },
      ],
      metrics: {
        issueCountByStage: { node: 1 },
        sceneCount: 1,
        beatCount: 1,
        cueCount: 1,
      },
    });
  });

  it("fixture마다 기대한 단계에서 성공하거나 멈춘다", () => {
    for (const { id, kind, scenario, tree } of LECTURE_SCENARIO_FIXTURES) {
      const result = getLectureGenerationResult(JSON.stringify(scenario), {
        scriptId: id,
        tree: createLectureCompilerTree(tree),
        usage: null,
      });

      expect(result.success, id).toBe(kind === "valid");
      if (!result.success) {
        expect(["schema", "compile"], id).toContain(result.failedStep);
      }
    }
  });
});
