import { describe, expect, it } from "vitest";
import { getAnimationCompositionIssues } from "@/src/entities/lecture";
import { ANIMATION_LAB_TREE } from "./fixtureTree";
import { createLabRecipeTree } from "./labRecipeTree";
import { getLabAnimation } from "./labTimeline";
import {
  createLabPresetSteps,
  getLabPresetAnimation,
  LAB_PRESETS,
} from "./presets";

const PRESET_CASES = LAB_PRESETS.map((preset) => [preset.id, preset] as const);

describe("LAB_PRESETS", () => {
  it("프리셋 ID는 겹치지 않는다", () => {
    const ids = LAB_PRESETS.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PRESET_CASES)("%s는 recipe만으로 만들어진다", (_, preset) => {
    expect(preset.calls.length).toBeGreaterThan(0);
    expect(() => getLabPresetAnimation(preset)).not.toThrow();
  });

  it.each(PRESET_CASES)("%s의 동작은 함께 실행할 수 있다", (_, preset) => {
    expect(
      getAnimationCompositionIssues(getLabPresetAnimation(preset), {
        allowLingeringPersist: true,
      }),
    ).toEqual([]);
  });

  it.each(PRESET_CASES)(
    "%s를 타임라인으로 읽고 다시 애니메이션으로 만들면 같다",
    (_, preset) => {
      expect(getLabAnimation(createLabPresetSteps(preset))).toEqual(
        getLabPresetAnimation(preset),
      );
    },
  );
});

describe("createLabRecipeTree", () => {
  const tree = createLabRecipeTree(ANIMATION_LAB_TREE);

  it("자식을 화면 순서대로 돌려준다", () => {
    expect(tree.getChildIds("2")).toEqual(["5", "6", "7"]);
    expect(tree.getChildIds("12")).toEqual([]);
  });

  it("조상에서 자손까지 내려가는 경로를 돌려준다", () => {
    expect(tree.getPathNodeIds("1", "12")).toEqual(["1", "3", "10", "12"]);
  });

  it("조상이 아니거나 모르는 노드면 null이다", () => {
    expect(tree.getPathNodeIds("12", "1")).toBeNull();
    expect(tree.getPathNodeIds("5", "12")).toBeNull();
    expect(tree.getPathNodeIds("1", "99")).toBeNull();
  });
});
