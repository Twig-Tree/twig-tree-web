import { describe, expect, expectTypeOf, it } from "vitest";
import type * as z from "zod/mini";
import { DEMO_LECTURES } from "./demoLectures";
import {
  lectureAnimationActionSchema,
  lectureAnimationSchema,
  lectureScriptSchema,
} from "./scriptSchema";
import {
  type LectureAnimation,
  type LectureAnimationAction,
  type LectureScript,
} from "./types";

const getIssuePaths = (schema: z.ZodMiniType, value: unknown) => {
  const result = schema.safeParse(value);

  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
};

describe("lectureScriptSchema", () => {
  /*
  한 방향 표기(ZodMiniType<LectureScript>)는 스키마가 허용값을 빠뜨려도 통과한다. 좁은 스키마도 넓은 타입에 대입되기 때문이다.
  양방향으로 같은지 확인해야 types.ts와 스키마 중 한쪽만 바뀐 것을 잡는다.
  */
  it("추출한 타입이 types.ts와 같다", () => {
    expectTypeOf<
      z.infer<typeof lectureAnimationActionSchema>
    >().toEqualTypeOf<LectureAnimationAction>();
    expectTypeOf<
      z.infer<typeof lectureAnimationSchema>
    >().toEqualTypeOf<LectureAnimation>();
    expectTypeOf<
      z.infer<typeof lectureScriptSchema>
    >().toEqualTypeOf<LectureScript>();
  });

  it("데모 강의 대본을 모두 통과시킨다", () => {
    let nextNodeId = 0;
    const scripts = DEMO_LECTURES.map((lecture) =>
      lecture.createScript(() => {
        nextNodeId += 1;
        return String(nextNodeId);
      }),
    );

    expect(scripts).toHaveLength(DEMO_LECTURES.length);
    for (const script of scripts) {
      expect(getIssuePaths(lectureScriptSchema, script)).toEqual([]);
    }
  });

  it("허용하지 않는 동작 종류와 값을 거부한다", () => {
    expect(
      getIssuePaths(lectureAnimationSchema, { type: "spin", durationMs: 100 }),
    ).toEqual(["type"]);
    expect(
      getIssuePaths(lectureAnimationSchema, {
        type: "highlight",
        targetNodeIds: ["1"],
        style: "wobble",
        tone: "info",
        durationMs: 100,
      }),
    ).toEqual(["style", "tone"]);
    expect(
      getIssuePaths(lectureAnimationSchema, { type: "reset", scope: "tree" }),
    ).toEqual(["scope"]);
  });

  it("시간과 배율은 유한해야 하고, 시간은 0 이상, 배율은 0보다 커야 한다", () => {
    expect(
      getIssuePaths(lectureAnimationSchema, {
        type: "focus",
        targetNodeIds: ["1"],
        maxZoom: 0,
        durationMs: Number.POSITIVE_INFINITY,
      }),
    ).toEqual(["maxZoom", "durationMs"]);
    expect(
      getIssuePaths(lectureAnimationSchema, { type: "wait", durationMs: -1 }),
    ).toEqual(["durationMs"]);
    expect(
      getIssuePaths(lectureAnimationSchema, { type: "wait", durationMs: 0 }),
    ).toEqual([]);
  });

  it("중첩한 그룹 안의 오류도 정확한 위치로 알린다", () => {
    expect(
      getIssuePaths(lectureAnimationSchema, {
        type: "group",
        mode: "sequence",
        children: [
          { type: "wait", durationMs: 100 },
          {
            type: "group",
            mode: "parallel",
            children: [
              { type: "wait", durationMs: 100 },
              { type: "collapse", targetNodeIds: [1], durationMs: 100 },
            ],
          },
        ],
      }),
    ).toEqual(["children.1.children.1.targetNodeIds.0"]);
    expect(
      getIssuePaths(lectureAnimationSchema, {
        type: "group",
        mode: "race",
        children: [],
      }),
    ).toEqual(["mode"]);
  });

  it("빈 대상 목록은 모양으로는 받는다", () => {
    expect(
      getIssuePaths(lectureAnimationSchema, {
        type: "dim",
        exceptNodeIds: [],
        durationMs: 100,
      }),
    ).toEqual([]);
  });
});
