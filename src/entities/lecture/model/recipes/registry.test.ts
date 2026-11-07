import { describe, expect, it } from "vitest";
import { type ScenarioDelivery } from "../scenario/types";
import { lectureAnimationSchema } from "../scriptSchema";
import { getLectureRecipeAnimation } from "./getLectureRecipeAnimation";
import {
  getLectureRecipe,
  LECTURE_RECIPE_REGISTRIES,
  type LectureRecipeId,
} from "./registry";
import { type LectureRecipeTree } from "./types";

const tree: LectureRecipeTree = {
  getChildIds: () => [],
  getPathNodeIds: () => null,
};

const recipes = LECTURE_RECIPE_REGISTRIES[1];

/*
recipe마다 대표 입력. Record로 두어 recipe를 추가하고 입력을 빠뜨리면 타입 오류가 난다.
*/
const SAMPLE_INPUTS: Record<LectureRecipeId<1>, unknown> = {
  introduce: { subject: "1", context: ["2", "3"] },
  spotlight: { subject: ["5", "6"] },
  compare: { left: ["5"], right: ["6"] },
  warn: { subject: ["9"] },
};

const DELIVERY_VARIANTS: Record<string, ScenarioDelivery | undefined> = {
  default: undefined,
  quickSubtle: { pace: "quick", intensity: "subtle" },
  slowStrong: { pace: "slow", intensity: "strong" },
  neutral: { tone: "neutral" },
  persist: { continuity: "persist" },
};

const RECIPE_IDS = Object.keys(SAMPLE_INPUTS) as LectureRecipeId<1>[];

const getAnimation = (
  id: LectureRecipeId<1>,
  delivery: ScenarioDelivery | undefined,
) => {
  const result = getLectureRecipeAnimation(
    getLectureRecipe(1, id),
    SAMPLE_INPUTS[id],
    {
      delivery,
      tree,
    },
  );

  if (!result.success) throw new Error(JSON.stringify(result.issues));

  return result.animation;
};

describe("recipe registry 1", () => {
  it("등록된 recipe와 대표 입력이 같다", () => {
    expect(Object.keys(recipes).sort()).toEqual([...RECIPE_IDS].sort());
  });

  describe.each(RECIPE_IDS)("%s", (id) => {
    it("delivery 변형마다 만든 애니메이션이 바뀌면 의도한 변경인지 확인한다", () => {
      expect(
        Object.fromEntries(
          Object.entries(DELIVERY_VARIANTS).map(([name, delivery]) => [
            name,
            getAnimation(id, delivery),
          ]),
        ),
      ).toMatchSnapshot();
    });

    it.each(Object.entries(DELIVERY_VARIANTS))(
      "%s delivery로 만든 애니메이션은 대본 스키마를 통과한다",
      (_, delivery) => {
        expect(
          lectureAnimationSchema.safeParse(getAnimation(id, delivery)).success,
        ).toBe(true);
      },
    );

    it("같은 입력과 delivery는 항상 같은 애니메이션을 만든다", () => {
      expect(getAnimation(id, undefined)).toEqual(getAnimation(id, undefined));
    });
  });

  it("neutral이면 강조 색 대신 흐림을 쓴다", () => {
    const animation = JSON.stringify(
      getAnimation("compare", { tone: "neutral" }),
    );

    expect(animation).not.toContain('"highlight"');
    expect(animation).toContain('"dim"');
  });

  it("subtle 경고는 흔들지 않는다", () => {
    expect(getAnimation("warn", { intensity: "subtle" })).toMatchObject({
      type: "highlight",
      style: "steady",
    });
  });

  it("한 노드를 두 역할에 쓰면 거부한다", () => {
    const result = getLectureRecipeAnimation(
      recipes.compare,
      { left: ["5"], right: ["5", "6"] },
      { delivery: undefined, tree },
    );

    expect(result.success).toBe(false);
  });
});
