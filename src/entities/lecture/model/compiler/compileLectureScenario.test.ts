import { describe, expect, it } from "vitest";
import { lectureScriptSchema } from "../scriptSchema";
import { type LectureScenario, type ScenarioCue } from "../scenario/types";
import { compileLectureScenario } from "./compileLectureScenario";
import { getCueRecipeAnimation } from "./intentRecipes";
import {
  getLectureNarration,
  MIN_NARRATION_DURATION_MS,
  NARRATION_MS_PER_CHARACTER,
} from "./narration";
import { TEST_COMPILER_TREE } from "./testTree";

const OPTIONS = { scriptId: "script-1", tree: TEST_COMPILER_TREE };

const INTRODUCE_ROOT: ScenarioCue = {
  intent: "introduce",
  roles: { subject: "1" },
};
const TRACE_TO_LEAF: ScenarioCue = {
  intent: "trace",
  roles: { source: "1", destination: "12" },
};

/*
함수 이름 : createScenario
기능 : 장면 하나에 주어진 cue 목록을 비트별로 담은 시나리오를 만든다.
인자 : ScenarioCue[][] beatCues -> 비트마다의 cue 목록
반환값 : 시나리오
*/
const createScenario = (beatCues: ScenarioCue[][]): LectureScenario => ({
  scenarioSchemaVersion: 1,
  recipeRegistryVersion: 1,
  title: "정렬 알고리즘",
  scenes: [
    {
      id: "scene-1",
      nodeId: "1",
      beats: beatCues.map((cues, index) => ({
        id: `beat-${index + 1}`,
        narration: { text: `${index + 1}번째 비트의 설명입니다.` },
        cues,
      })),
    },
  ],
});

const getCueAnimation = (cue: ScenarioCue) => {
  const result = getCueRecipeAnimation(cue, 1, TEST_COMPILER_TREE);
  if (!result.success) throw new Error("cue를 만들지 못했습니다.");
  return result.animation;
};

describe("compileLectureScenario", () => {
  it("시나리오의 제목과 장면·비트 ID를 그대로 옮기고 대본 스키마를 통과한다", () => {
    const result = compileLectureScenario(
      createScenario([[INTRODUCE_ROOT], [TRACE_TO_LEAF]]),
      OPTIONS,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.script.id).toBe("script-1");
    expect(result.script.title).toBe("정렬 알고리즘");
    expect(result.script.scenes.map(({ id, nodeId }) => [id, nodeId])).toEqual([
      ["scene-1", "1"],
    ]);
    expect(result.script.scenes[0].beats.map(({ id }) => id)).toEqual([
      "beat-1",
      "beat-2",
    ]);
    expect(lectureScriptSchema.safeParse(result.script).success).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("같은 입력은 같은 대본을 만든다", () => {
    const scenario = createScenario([[INTRODUCE_ROOT, TRACE_TO_LEAF]]);

    expect(compileLectureScenario(scenario, OPTIONS)).toEqual(
      compileLectureScenario(structuredClone(scenario), OPTIONS),
    );
  });

  it("cue 하나인 비트는 그 애니메이션을 그대로 쓰고 출처를 비트 전체에 단다", () => {
    const result = compileLectureScenario(
      createScenario([[INTRODUCE_ROOT]]),
      OPTIONS,
    );

    if (!result.success) throw new Error("컴파일하지 못했습니다.");

    expect(result.script.scenes[0].beats[0].animation).toEqual(
      getCueAnimation(INTRODUCE_ROOT),
    );
    expect(result.sourceMap["beat-1"]).toEqual([
      {
        animationPath: [],
        source: {
          type: "cue",
          cueIndex: 0,
          intent: "introduce",
          recipeId: "introduce",
        },
      },
    ]);
  });

  it("cue 여럿인 비트는 순차 그룹으로 잇고 cue마다 자식 위치를 기록한다", () => {
    const result = compileLectureScenario(
      createScenario([[INTRODUCE_ROOT, TRACE_TO_LEAF]]),
      OPTIONS,
    );

    if (!result.success) throw new Error("컴파일하지 못했습니다.");

    expect(result.script.scenes[0].beats[0].animation).toEqual({
      type: "group",
      mode: "sequence",
      children: [
        getCueAnimation(INTRODUCE_ROOT),
        getCueAnimation(TRACE_TO_LEAF),
      ],
    });
    expect(
      result.sourceMap["beat-1"].map(({ animationPath, source }) => [
        animationPath,
        source.type === "cue" && source.recipeId,
      ]),
    ).toEqual([
      [["children", 0], "introduce"],
      [["children", 1], "trace-path"],
    ]);
  });

  it("cue가 없는 비트는 길이 0인 wait을 넣고 컴파일러 출처로 기록한다", () => {
    const result = compileLectureScenario(createScenario([[]]), OPTIONS);

    if (!result.success) throw new Error("컴파일하지 못했습니다.");

    expect(result.script.scenes[0].beats[0].animation).toEqual({
      type: "wait",
      durationMs: 0,
    });
    expect(result.sourceMap["beat-1"]).toEqual([
      {
        animationPath: [],
        source: { type: "compiler", reason: "empty-beat" },
      },
    ]);
  });

  it("스키마를 통과하지 못하면 schema 단계 문제로 보고하고 recipe를 실행하지 않는다", () => {
    const scenario = createScenario([[INTRODUCE_ROOT]]);
    const result = compileLectureScenario(
      { ...scenario, scenarioSchemaVersion: 2 },
      OPTIONS,
    );

    expect(result).toEqual({
      success: false,
      issues: [
        expect.objectContaining({
          severity: "error",
          stage: "schema",
          path: ["scenarioSchemaVersion"],
        }),
      ],
    });
  });

  it("recipe 실패를 시나리오 위치로 옮기고, 실패한 cue가 있어도 나머지 문제까지 모두 보고한다", () => {
    const result = compileLectureScenario(
      createScenario([
        [
          INTRODUCE_ROOT,
          { intent: "trace", roles: { source: "5", destination: "8" } },
        ],
        [{ intent: "summarize", roles: { subject: "12" } }],
      ]),
      OPTIONS,
    );

    expect(result.success).toBe(false);
    expect(
      !result.success &&
        result.issues.map(({ severity, stage, path }) => ({
          severity,
          stage,
          path,
        })),
    ).toEqual([
      {
        severity: "error",
        stage: "recipe",
        path: ["scenes", 0, "beats", 0, "cues", 1, "roles", "destination"],
      },
      {
        severity: "error",
        stage: "recipe",
        path: ["scenes", 0, "beats", 1, "cues", 0, "roles", "subject"],
      },
    ]);
  });
});

describe("getLectureNarration", () => {
  it("글자 수에 글자당 시간을 곱한다", () => {
    const text = "가".repeat(30);

    expect(getLectureNarration({ text })).toEqual({
      text,
      fallbackDurationMs: 30 * NARRATION_MS_PER_CHARACTER,
    });
  });

  it("짧은 문장도 최소 시간을 남긴다", () => {
    expect(getLectureNarration({ text: "네." }).fallbackDurationMs).toBe(
      MIN_NARRATION_DURATION_MS,
    );
  });

  it("UTF-16 두 칸을 쓰는 글자를 한 글자로 센다", () => {
    const text = "🌳".repeat(20);

    expect(getLectureNarration({ text }).fallbackDurationMs).toBe(
      20 * NARRATION_MS_PER_CHARACTER,
    );
  });
});
