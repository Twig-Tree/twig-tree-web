import { describe, expect, it } from "vitest";
import {
  getLabRecipeRun,
  LAB_RECIPE_IDS,
  LAB_RECIPE_SAMPLE_INPUTS,
} from "./labRecipeRun";
import { getLabStepsFromAnimation } from "./labTimeline";

const getSampleText = (recipeId: (typeof LAB_RECIPE_IDS)[number]) =>
  JSON.stringify(LAB_RECIPE_SAMPLE_INPUTS[recipeId]);

describe("getLabRecipeRun", () => {
  it.each(LAB_RECIPE_IDS)(
    "%s의 예시 입력은 실행되고 타임라인으로 옮길 수 있다",
    (recipeId) => {
      const run = getLabRecipeRun(recipeId, getSampleText(recipeId), {});

      if (!run.success) throw new Error(JSON.stringify(run.issues));

      expect(getLabStepsFromAnimation(run.animation)).toHaveProperty("steps");
    },
  );

  it("JSON이 아니면 입력 전체의 문제로 알린다", () => {
    expect(getLabRecipeRun("spotlight", "{ subject:", {})).toEqual({
      success: false,
      issues: [{ path: "", message: "JSON 형식이 아닙니다." }],
    });
  });

  it("트리에서 성립하지 않는 입력은 그 역할의 위치와 함께 알린다", () => {
    const run = getLabRecipeRun(
      "trace-path",
      JSON.stringify({ source: "5", destination: "12" }),
      {},
    );

    expect(!run.success && run.issues.map(({ path }) => path)).toEqual([
      "destination",
    ]);
  });

  it("고른 delivery가 recipe 기본값을 덮는다", () => {
    const text = getSampleText("spotlight");
    const slow = getLabRecipeRun("spotlight", text, { pace: "slow" });
    const quick = getLabRecipeRun("spotlight", text, { pace: "quick" });

    expect(slow.success && quick.success).toBe(true);
    expect(JSON.stringify(slow)).not.toBe(JSON.stringify(quick));
  });
});
