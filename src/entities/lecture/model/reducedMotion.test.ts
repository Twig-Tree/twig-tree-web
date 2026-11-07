import { describe, expect, it } from "vitest";
import {
  type LectureEffectAction,
  type LectureEffectType,
} from "./atomicEffects";
import {
  getReducedMotionAction,
  getReducedMotionAnimation,
} from "./reducedMotion";
import { type LectureAnimation } from "./types";

/*
Record로 두어 동작을 추가하고 기대값을 빠뜨리면 타입 오류가 난다.
*/
const CASES: {
  [T in LectureEffectType]: {
    input: LectureEffectAction<T>;
    expected: LectureEffectAction<T>;
  };
} = {
  focus: {
    input: {
      type: "focus",
      targetNodeIds: ["1"],
      maxZoom: 1.2,
      durationMs: 700,
    },
    expected: {
      type: "focus",
      targetNodeIds: ["1"],
      maxZoom: 1.2,
      durationMs: 0,
    },
  },
  highlight: {
    input: {
      type: "highlight",
      targetNodeIds: ["1"],
      style: "shake",
      tone: "danger",
      durationMs: 1200,
    },
    expected: {
      type: "highlight",
      targetNodeIds: ["1"],
      style: "steady",
      tone: "danger",
      durationMs: 1200,
    },
  },
  dim: {
    input: { type: "dim", exceptNodeIds: ["1"], durationMs: 1800 },
    expected: { type: "dim", exceptNodeIds: ["1"], durationMs: 1800 },
  },
  trace: {
    input: {
      type: "trace",
      nodeIds: ["1", "2", "3"],
      durationMs: 1300,
      mode: "progressive",
      direction: "reverse",
    },
    expected: {
      type: "trace",
      nodeIds: ["1", "2", "3"],
      durationMs: 1300,
      mode: "simultaneous",
      direction: "reverse",
    },
  },
  wait: {
    input: { type: "wait", durationMs: 450 },
    expected: { type: "wait", durationMs: 450 },
  },
  collapse: {
    input: { type: "collapse", targetNodeIds: ["1"], durationMs: 850 },
    expected: { type: "collapse", targetNodeIds: ["1"], durationMs: 0 },
  },
  expand: {
    input: { type: "expand", targetNodeIds: ["1"], durationMs: 850 },
    expected: { type: "expand", targetNodeIds: ["1"], durationMs: 0 },
  },
  reset: {
    input: { type: "reset", scope: "all" },
    expected: { type: "reset", scope: "all" },
  },
};

describe("getReducedMotionAction", () => {
  it.each(Object.entries(CASES))(
    "%s 동작을 정책에 맞게 바꾼다",
    (_, { input, expected }) => {
      expect(getReducedMotionAction(input)).toEqual(expected);
    },
  );

  it("이미 멈춘 꾸밈은 같은 객체를 돌려준다", () => {
    const steady: LectureEffectAction<"highlight"> = {
      type: "highlight",
      targetNodeIds: ["1"],
      style: "steady",
      durationMs: 1200,
    };

    expect(getReducedMotionAction(steady)).toBe(steady);
  });

  it("원래 동작을 바꾸지 않는다", () => {
    const input = structuredClone(CASES.focus.input);

    getReducedMotionAction(input);

    expect(input).toEqual(CASES.focus.input);
  });
});

describe("getReducedMotionAnimation", () => {
  it("중첩 그룹의 구조는 두고 안의 동작만 바꾼다", () => {
    const animation: LectureAnimation = {
      type: "group",
      mode: "sequence",
      children: [
        CASES.focus.input,
        {
          type: "group",
          mode: "parallel",
          children: [CASES.highlight.input, CASES.wait.input],
        },
      ],
    };

    expect(getReducedMotionAnimation(animation)).toEqual({
      type: "group",
      mode: "sequence",
      children: [
        CASES.focus.expected,
        {
          type: "group",
          mode: "parallel",
          children: [CASES.highlight.expected, CASES.wait.expected],
        },
      ],
    });
  });
});
