import { describe, expect, it, vi } from "vitest";
import * as z from "zod/mini";
import { nodeIdListSchema } from "../scenario/schema";
import {
  defineLectureRecipe,
  getLectureRecipeAnimation,
} from "./getLectureRecipeAnimation";
import { type LectureRecipeTree } from "./types";

const tree: LectureRecipeTree = {
  getChildIds: () => [],
  getPathNodeIds: () => null,
};

/*
입력 노드를 motion 값으로 강조하는 시험용 recipe
*/
const sampleRecipe = defineLectureRecipe({
  inputSchema: z.strictObject({ subject: nodeIdListSchema }),
  defaultDelivery: {
    pace: "quick",
    intensity: "subtle",
    tone: "warning",
    continuity: "transient",
  },
  create: ({ subject }, { motion }) => ({
    type: "highlight",
    targetNodeIds: subject,
    style: motion.highlightStyle,
    durationMs: motion.durationMs.emphasis,
    ...(motion.highlightTone === null ? {} : { tone: motion.highlightTone }),
  }),
});

describe("getLectureRecipeAnimation", () => {
  it("delivery가 없으면 recipe의 기본값으로 motion 값을 고른다", () => {
    expect(
      getLectureRecipeAnimation(
        sampleRecipe,
        { subject: ["1"] },
        { delivery: undefined, tree },
      ),
    ).toEqual({
      success: true,
      animation: {
        type: "highlight",
        targetNodeIds: ["1"],
        style: "steady",
        durationMs: 800,
        tone: "warning",
      },
    });
  });

  it("부르는 쪽이 고른 delivery가 recipe 기본값보다 우선한다", () => {
    const result = getLectureRecipeAnimation(
      sampleRecipe,
      { subject: ["1"] },
      { delivery: { pace: "slow", tone: "neutral" }, tree },
    );

    expect(result).toEqual({
      success: true,
      animation: {
        type: "highlight",
        targetNodeIds: ["1"],
        style: "steady",
        durationMs: 1800,
      },
    });
  });

  it("입력이 스키마를 통과하지 못하면 create를 부르지 않고 위치별 오류를 돌려준다", () => {
    const create = vi.fn(sampleRecipe.create);
    const result = getLectureRecipeAnimation(
      { ...sampleRecipe, create },
      { subject: [], extra: "1" },
      { delivery: undefined, tree },
    );

    expect(create).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(!result.success && result.issues.map(({ path }) => path)).toEqual(
      expect.arrayContaining([["subject"], []]),
    );
  });

  it("recipe에 트리 조회 함수를 그대로 넘긴다", () => {
    const getChildIds = vi.fn(() => ["2", "3"]);
    const childRecipe = defineLectureRecipe({
      ...sampleRecipe,
      inputSchema: z.strictObject({ parent: z.string() }),
      create: ({ parent }, context) => ({
        type: "focus",
        targetNodeIds: context.tree.getChildIds(parent),
        maxZoom: context.motion.focusMaxZoom,
        durationMs: context.motion.durationMs.camera,
      }),
    });

    const result = getLectureRecipeAnimation(
      childRecipe,
      { parent: "1" },
      { delivery: undefined, tree: { ...tree, getChildIds } },
    );

    expect(getChildIds).toHaveBeenCalledWith("1");
    expect(result).toMatchObject({
      success: true,
      animation: { targetNodeIds: ["2", "3"] },
    });
  });
});
