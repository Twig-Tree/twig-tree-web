import { describe, expect, it } from "vitest";
import {
  getLectureActionNodeIds,
  getLectureActionWithNodeIds,
  LECTURE_ATOMIC_EFFECTS,
  LECTURE_EFFECT_TYPES,
  type LectureEffectDefinition,
} from "./atomicEffects";
import { lectureAnimationActionSchema } from "./scriptSchema";
import { type LectureAnimationAction } from "./types";

const sampleActions: Record<
  LectureAnimationAction["type"],
  LectureAnimationAction
> = {
  focus: { type: "focus", targetNodeIds: ["1"], maxZoom: 1, durationMs: 800 },
  highlight: {
    type: "highlight",
    targetNodeIds: ["1"],
    style: "pulse",
    durationMs: 800,
  },
  dim: { type: "dim", exceptNodeIds: ["1"], durationMs: 800 },
  trace: { type: "trace", nodeIds: ["1", "2"], durationMs: 800 },
  badge: {
    type: "badge",
    targetNodeIds: ["1"],
    label: "핵심",
    durationMs: 800,
  },
  wait: { type: "wait", durationMs: 800 },
  collapse: { type: "collapse", targetNodeIds: ["1"], durationMs: 800 },
  expand: { type: "expand", targetNodeIds: ["1"], durationMs: 800 },
  reset: { type: "reset", scope: "all" },
};

describe("LECTURE_ATOMIC_EFFECTS", () => {
  it("대본 스키마가 받는 동작 종류를 모두 등록한다", () => {
    const schemaTypes = lectureAnimationActionSchema.def.options.map(
      (option) => option.def.shape.type.def.values[0],
    );

    expect([...LECTURE_EFFECT_TYPES].sort()).toEqual([...schemaTypes].sort());
  });

  it("각 동작의 스키마는 자기 동작만 통과시킨다", () => {
    for (const type of LECTURE_EFFECT_TYPES) {
      for (const [sampleType, action] of Object.entries(sampleActions)) {
        expect(
          LECTURE_ATOMIC_EFFECTS[type].schema.safeParse(action).success,
        ).toBe(sampleType === type);
      }
    }
  });

  it("타입과 어긋난 등록은 타입 오류가 난다", () => {
    const wrongField: LectureEffectDefinition<"dim">["target"] = {
      family: "node",
      // @ts-expect-error dim은 exceptNodeIds로 노드를 가리킨다
      field: "targetNodeIds",
    };
    // @ts-expect-error wait는 노드를 가리키지 않는다
    const nodeTargetForWait: LectureEffectDefinition<"wait">["target"] = {
      family: "node",
      field: "targetNodeIds",
    };
    // @ts-expect-error focus에는 persist 필드가 없다
    const persistableFocus: LectureEffectDefinition<"focus">["isPersistable"] = true;

    expect([wrongField, nodeTargetForWait, persistableFocus]).toHaveLength(3);
  });
});

describe("getLectureActionNodeIds", () => {
  it("동작마다 다른 필드에서 노드 ID 목록을 읽는다", () => {
    expect(getLectureActionNodeIds(sampleActions.focus)).toEqual(["1"]);
    expect(getLectureActionNodeIds(sampleActions.dim)).toEqual(["1"]);
    expect(getLectureActionNodeIds(sampleActions.trace)).toEqual(["1", "2"]);
    expect(getLectureActionNodeIds(sampleActions.wait)).toBeNull();
    expect(getLectureActionNodeIds(sampleActions.reset)).toBeNull();
  });
});

describe("getLectureActionWithNodeIds", () => {
  it("동작의 노드 필드만 바꾼 새 동작을 만든다", () => {
    const dim = sampleActions.dim;
    const nextDim = getLectureActionWithNodeIds(dim, ["3"]);

    expect(nextDim).toEqual({ ...dim, exceptNodeIds: ["3"] });
    expect(nextDim).not.toBe(dim);
    expect(getLectureActionWithNodeIds(sampleActions.trace, ["4"])).toEqual({
      ...sampleActions.trace,
      nodeIds: ["4"],
    });
  });

  it("노드를 가리키지 않는 동작은 그대로 돌려준다", () => {
    expect(getLectureActionWithNodeIds(sampleActions.wait, ["1"])).toBe(
      sampleActions.wait,
    );
  });
});
