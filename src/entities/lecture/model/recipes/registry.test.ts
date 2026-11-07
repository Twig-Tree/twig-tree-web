import { describe, expect, it } from "vitest";
import { type ScenarioDelivery } from "../scenario/types";
import { lectureAnimationSchema } from "../scriptSchema";
import { getAnimationCompositionIssues } from "./getAnimationCompositionIssues";
import { getLectureRecipeAnimation } from "./getLectureRecipeAnimation";
import {
  getLectureRecipe,
  LECTURE_RECIPE_REGISTRIES,
  type LectureRecipeId,
} from "./registry";
import { type LectureAnimation } from "../types";
import { type LectureRecipeTree } from "./types";

/*
시험용 트리. 1 → (2, 3, 4), 2 → (5, 6, 7), 3 → (8, 9, 10), 10 → (11, 12)
*/
const CHILD_IDS: Record<string, string[]> = {
  "1": ["2", "3", "4"],
  "2": ["5", "6", "7"],
  "3": ["8", "9", "10"],
  "10": ["11", "12"],
};

const getParentId = (nodeId: string): string | undefined =>
  Object.keys(CHILD_IDS).find((parentId) =>
    CHILD_IDS[parentId].includes(nodeId),
  );

const tree: LectureRecipeTree = {
  getChildIds: (nodeId) => CHILD_IDS[nodeId] ?? [],
  getPathNodeIds: (ancestorNodeId, descendantNodeId) => {
    const path = [descendantNodeId];

    while (path[0] !== ancestorNodeId) {
      const parentId = getParentId(path[0]);
      if (parentId === undefined) return null;
      path.unshift(parentId);
    }

    return path;
  },
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
  verdict: { correctAnswer: ["5"], incorrectAnswer: ["6"] },
  "trace-path": { source: "1", destination: "12" },
  "reveal-branch": { parent: "2" },
  "reveal-nodes": { subject: ["11", "12"] },
  "tour-children": { parent: "2" },
  "collapse-summary": { subject: "2" },
  recap: { subject: ["2", "7", "8", "9"] },
};

const DELIVERY_VARIANTS: Record<string, ScenarioDelivery | undefined> = {
  default: undefined,
  quickSubtle: { pace: "quick", intensity: "subtle" },
  slowStrong: { pace: "slow", intensity: "strong" },
  neutral: { tone: "neutral" },
  persist: { continuity: "persist" },
  neutralPersist: { tone: "neutral", continuity: "persist" },
};

/*
랩 타임라인은 단위 동작, 동작만 담은 병렬 그룹, 그리고 그 둘을 담은 순차 그룹까지만 표현한다.
recipe 규칙이 아니라 프리셋을 랩에서 편집하기 위한 조건이다.
*/
const isActionOnlyParallel = (animation: LectureAnimation): boolean =>
  animation.type !== "group" ||
  (animation.mode === "parallel" &&
    animation.children.every((child) => child.type !== "group"));

const isLabTimelineShape = (animation: LectureAnimation): boolean =>
  isActionOnlyParallel(animation) ||
  (animation.type === "group" &&
    animation.mode === "sequence" &&
    animation.children.every(isActionOnlyParallel));

const RECIPE_IDS = Object.keys(SAMPLE_INPUTS) as LectureRecipeId<1>[];

const getResult = (
  id: LectureRecipeId<1>,
  delivery: ScenarioDelivery | undefined,
  input: unknown = SAMPLE_INPUTS[id],
) =>
  getLectureRecipeAnimation(getLectureRecipe(1, id), input, { delivery, tree });

const getAnimation = (
  id: LectureRecipeId<1>,
  delivery: ScenarioDelivery | undefined,
  input: unknown = SAMPLE_INPUTS[id],
) => {
  const result = getLectureRecipeAnimation(getLectureRecipe(1, id), input, {
    delivery,
    tree,
  });

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

    it.each(Object.entries(DELIVERY_VARIANTS))(
      "%s delivery로 만든 애니메이션은 함께 실행할 수 있다",
      (_, delivery) => {
        expect(
          getAnimationCompositionIssues(getAnimation(id, delivery), {
            allowLingeringPersist: delivery?.continuity === "persist",
          }),
        ).toEqual([]);
      },
    );

    it.each(Object.entries(DELIVERY_VARIANTS))(
      "%s delivery로 만든 애니메이션은 랩 타임라인이 표현하는 모양(순차 안의 병렬)을 넘지 않는다",
      (_, delivery) => {
        expect(isLabTimelineShape(getAnimation(id, delivery))).toBe(true);
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

  describe("트리를 읽는 recipe", () => {
    it("도착 노드가 위에 있으면 같은 경로를 거꾸로 그린다", () => {
      expect(
        getAnimation("trace-path", undefined, {
          source: "12",
          destination: "3",
        }),
      ).toMatchObject({
        children: [
          { type: "focus", targetNodeIds: ["3", "10", "12"] },
          { type: "trace", nodeIds: ["3", "10", "12"], direction: "reverse" },
          { type: "highlight", targetNodeIds: ["3"] },
        ],
      });
    });

    it("순차 추적 시간은 연결선 수에 비례한다", () => {
      expect(getAnimation("trace-path", { pace: "normal" })).toMatchObject({
        children: [{}, { type: "trace", durationMs: 650 * 3 }, {}],
      });
    });

    it("조상·자손 관계가 아니면 도착 노드 위치로 실패를 보고한다", () => {
      expect(
        getResult("trace-path", undefined, { source: "5", destination: "12" }),
      ).toEqual({
        success: false,
        issues: [{ path: ["destination"], message: expect.any(String) }],
      });
    });

    it.each([
      ["reveal-branch", { parent: "12" }, ["parent"]],
      ["tour-children", { parent: "12" }, ["parent"]],
      ["collapse-summary", { subject: "12" }, ["subject"]],
    ] as const)("%s는 자식이 없는 노드에서 실패한다", (id, input, path) => {
      expect(getResult(id, undefined, input)).toMatchObject({
        success: false,
        issues: [{ path }],
      });
    });

    it.each(["reveal-branch", "tour-children"] as const)(
      "%s는 parent의 자식이 아닌 노드를 children 위치로 거부한다",
      (id) => {
        expect(
          getResult(id, undefined, { parent: "12", children: ["5"] }),
        ).toMatchObject({
          success: false,
          issues: [{ path: ["children", 0] }],
        });
        expect(
          getResult(id, undefined, { parent: "2", children: ["5", "8"] }),
        ).toMatchObject({
          success: false,
          issues: [{ path: ["children", 1] }],
        });
      },
    );

    it("자식 목록을 주면 그 노드만 그 순서로 쓴다", () => {
      expect(
        getAnimation("tour-children", undefined, {
          parent: "2",
          children: ["7", "5"],
        }),
      ).toMatchObject({
        children: [
          { type: "focus", targetNodeIds: ["2", "7", "5"] },
          { targetNodeIds: ["7"] },
          { targetNodeIds: ["5"] },
        ],
      });
    });
  });

  describe("reveal-nodes", () => {
    it("카메라를 대상에 먼저 맞춰 접힌 조상을 펼치게 한 뒤 강조한다", () => {
      expect(getAnimation("reveal-nodes", undefined)).toMatchObject({
        type: "group",
        mode: "sequence",
        children: [
          { type: "focus", targetNodeIds: ["11", "12"] },
          getAnimation("spotlight", undefined, { subject: ["11", "12"] }),
        ],
      });
    });
  });

  describe("verdict", () => {
    it("delivery tone과 관계없이 정답은 success, 오답은 danger다", () => {
      expect(getAnimation("verdict", { tone: "neutral" })).toMatchObject({
        children: [
          { style: "shake", tone: "danger" },
          { type: "wait" },
          { style: "bounce", tone: "success" },
        ],
      });
    });

    it("오답이 없으면 정답만 강조한다", () => {
      expect(
        getAnimation("verdict", undefined, { correctAnswer: ["5"] }),
      ).toMatchObject({ type: "highlight", targetNodeIds: ["5"] });
    });

    it("정답이 없으면 오답만 흔든다", () => {
      expect(
        getAnimation("verdict", undefined, { incorrectAnswer: ["6"] }),
      ).toMatchObject({
        type: "highlight",
        targetNodeIds: ["6"],
        style: "shake",
        tone: "danger",
      });
    });

    it("정답과 오답이 모두 없으면 거부한다", () => {
      const result = getLectureRecipeAnimation(
        getLectureRecipe(1, "verdict"),
        {},
        {
          delivery: undefined,
          tree,
        },
      );

      expect(result.success).toBe(false);
    });
  });
});
