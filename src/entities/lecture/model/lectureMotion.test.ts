import { describe, expect, it } from "vitest";
import {
  getLectureMotion,
  getResolvedDelivery,
  LECTURE_INTENT_DELIVERY_DEFAULTS,
} from "./lectureMotion";
import { type SemanticIntent } from "./scenario/types";

const INTENTS = Object.keys(
  LECTURE_INTENT_DELIVERY_DEFAULTS,
) as SemanticIntent[];

describe("getResolvedDelivery", () => {
  it("delivery가 없으면 intent의 기본값을 쓴다", () => {
    expect(getResolvedDelivery("warn", undefined)).toEqual(
      LECTURE_INTENT_DELIVERY_DEFAULTS.warn,
    );
  });

  it("모델이 고른 값은 기본값보다 우선한다", () => {
    expect(
      getResolvedDelivery("warn", { pace: "slow", tone: "danger" }),
    ).toEqual({
      pace: "slow",
      intensity: "strong",
      tone: "danger",
      continuity: "transient",
    });
  });

  it("undefined로 들어온 값은 기본값을 지우지 않는다", () => {
    expect(getResolvedDelivery("correct", { tone: undefined }).tone).toBe(
      "positive",
    );
  });
});

describe("getLectureMotion", () => {
  it("intent마다 delivery가 없을 때의 값이 바뀌면 의도한 변경인지 확인한다", () => {
    expect(
      Object.fromEntries(
        INTENTS.map((intent) => [intent, getLectureMotion(intent, undefined)]),
      ),
    ).toMatchSnapshot();
  });

  it("pace가 모든 자리의 시간을 함께 고른다", () => {
    const quick = getLectureMotion("introduce", { pace: "quick" });
    const slow = getLectureMotion("introduce", { pace: "slow" });

    for (const slot of Object.keys(quick.durationMs) as Array<
      keyof typeof quick.durationMs
    >) {
      expect(quick.durationMs[slot]).toBeLessThan(slow.durationMs[slot]);
    }
  });

  it("intensity가 강조 스타일과 focus 배율을 고른다", () => {
    expect(
      getLectureMotion("introduce", { intensity: "strong" }),
    ).toMatchObject({ highlightStyle: "pop", focusMaxZoom: 1.4 });
  });

  it("neutral tone은 강조 색을 쓰지 않는다", () => {
    expect(getLectureMotion("transition", undefined).highlightTone).toBeNull();
    expect(
      getLectureMotion("emphasize", { tone: "neutral" }).highlightTone,
    ).toBeNull();
  });

  it("continuity가 persist면 효과를 남긴다", () => {
    expect(getLectureMotion("recap", { continuity: "persist" }).persist).toBe(
      true,
    );
    expect(getLectureMotion("recap", undefined).persist).toBe(false);
  });
});
