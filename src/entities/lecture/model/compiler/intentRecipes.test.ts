import { describe, expect, it } from "vitest";
import { getResolvedDelivery } from "../lectureMotion";
import { getLectureRecipeAnimation } from "../recipes/getLectureRecipeAnimation";
import { getLectureRecipe } from "../recipes/registry";
import { scenarioCueSchema } from "../scenario/schema";
import { type ScenarioCue, type SemanticIntent } from "../scenario/types";
import { getCueRecipeAnimation, LECTURE_INTENT_RECIPES } from "./intentRecipes";
import { TEST_COMPILER_TREE } from "./testTree";

/*
intent마다 받을 수 있는 role을 모두 채운 cue. Record로 두어 intent를 추가하고 빠뜨리면 타입 오류가 난다.
선택 role까지 채워야 연결표의 모든 입력 이름이 recipe 스키마를 통과하는지 확인된다.
*/
const SAMPLE_CUES: { [Intent in SemanticIntent]: ScenarioCue } = {
  introduce: { intent: "introduce", roles: { subject: "1", context: ["2"] } },
  emphasize: { intent: "emphasize", roles: { subject: ["5", "6"] } },
  compare: { intent: "compare", roles: { left: ["5"], right: ["6"] } },
  decompose: {
    intent: "decompose",
    roles: { parent: "2", children: ["5", "6"] },
  },
  trace: { intent: "trace", roles: { source: "1", destination: "12" } },
  reveal: { intent: "reveal", roles: { subject: ["11"] } },
  warn: { intent: "warn", roles: { subject: ["9"] } },
  correct: {
    intent: "correct",
    roles: { correctAnswer: ["5"], incorrectAnswer: ["6"] },
  },
  incorrect: {
    intent: "incorrect",
    roles: { incorrectAnswer: ["6"], correctAnswer: ["5"] },
  },
  transition: {
    intent: "transition",
    roles: { source: "2", destination: "3" },
  },
  recap: { intent: "recap", roles: { subject: ["2", "3"] } },
  summarize: { intent: "summarize", roles: { subject: "2", context: ["3"] } },
};

describe("LECTURE_INTENT_RECIPES", () => {
  it("버전 1의 intent → recipe 연결", () => {
    expect(
      Object.fromEntries(
        Object.entries(LECTURE_INTENT_RECIPES[1]).map(
          ([intent, { recipeId }]) => [intent, recipeId],
        ),
      ),
    ).toMatchInlineSnapshot(`
      {
        "compare": "compare",
        "correct": "verdict",
        "decompose": "reveal-branch",
        "emphasize": "spotlight",
        "incorrect": "verdict",
        "introduce": "introduce",
        "recap": "recap",
        "reveal": "spotlight",
        "summarize": "collapse-summary",
        "trace": "trace-path",
        "transition": "introduce",
        "warn": "warn",
      }
    `);
  });

  it.each(Object.entries(SAMPLE_CUES))(
    "%s cue의 role을 모두 채워도 recipe가 애니메이션을 만든다",
    (_intent, cue) => {
      expect(scenarioCueSchema.safeParse(cue).success).toBe(true);
      expect(getCueRecipeAnimation(cue, 1, TEST_COMPILER_TREE).success).toBe(
        true,
      );
    },
  );
});

describe("getCueRecipeAnimation", () => {
  it("delivery를 recipe 기본값이 아니라 intent 기본값으로 채운다", () => {
    const cue = SAMPLE_CUES.transition;
    const result = getCueRecipeAnimation(cue, 1, TEST_COMPILER_TREE);
    const recipe = getLectureRecipe(1, "introduce");
    const input = { subject: "3" };

    const withIntentDefaults = getLectureRecipeAnimation(recipe, input, {
      delivery: getResolvedDelivery("transition", undefined),
      tree: TEST_COMPILER_TREE,
    });
    const withRecipeDefaults = getLectureRecipeAnimation(recipe, input, {
      delivery: undefined,
      tree: TEST_COMPILER_TREE,
    });

    if (!result.success || !withIntentDefaults.success) {
      throw new Error("transition cue를 만들지 못했습니다.");
    }

    expect(result.animation).toEqual(withIntentDefaults.animation);
    expect(result.animation).not.toEqual(
      withRecipeDefaults.success && withRecipeDefaults.animation,
    );
  });

  it("연결표에 없는 role은 recipe에 넘기지 않는다", () => {
    const withSource = getCueRecipeAnimation(
      SAMPLE_CUES.transition,
      1,
      TEST_COMPILER_TREE,
    );
    const withoutSource = getCueRecipeAnimation(
      { intent: "transition", roles: { destination: "3" } },
      1,
      TEST_COMPILER_TREE,
    );

    expect(withSource).toEqual(withoutSource);
  });

  it("cue delivery가 intent 기본값보다 우선한다", () => {
    const result = getCueRecipeAnimation(
      { ...SAMPLE_CUES.warn, delivery: { tone: "danger" } },
      1,
      TEST_COMPILER_TREE,
    );

    expect(JSON.stringify(result)).toContain('"tone":"danger"');
  });

  it.each([
    {
      name: "자식이 아닌 노드",
      cue: {
        intent: "decompose",
        roles: { parent: "2", children: ["5", "8"] },
      },
      path: ["roles", "children", 1],
    },
    {
      name: "조상·자손이 아닌 경로",
      cue: { intent: "trace", roles: { source: "5", destination: "8" } },
      path: ["roles", "destination"],
    },
    {
      name: "자식이 없는 노드 요약",
      cue: { intent: "summarize", roles: { subject: "12" } },
      path: ["roles", "subject"],
    },
  ] satisfies { name: string; cue: ScenarioCue; path: PropertyKey[] }[])(
    "recipe 실패($name)를 cue의 role 위치로 옮긴다",
    ({ cue, path }) => {
      const result = getCueRecipeAnimation(cue, 1, TEST_COMPILER_TREE);

      expect(result.success).toBe(false);
      expect(
        !result.success && result.issues.map((issue) => issue.path),
      ).toEqual([path]);
    },
  );
});
