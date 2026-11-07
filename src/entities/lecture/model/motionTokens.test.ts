import { describe, expect, it } from "vitest";
import {
  LECTURE_DURATION_TOKENS,
  LECTURE_EASING_TOKENS,
  LECTURE_INTENSITY_TOKENS,
  LECTURE_TONE_TOKENS,
} from "./motionTokens";
import { lectureHighlightActionSchema } from "./scriptSchema";

describe("motion token", () => {
  it("값이 바뀌면 의도한 변경인지 확인한다", () => {
    expect({
      duration: LECTURE_DURATION_TOKENS,
      easing: LECTURE_EASING_TOKENS,
      intensity: LECTURE_INTENSITY_TOKENS,
      tone: LECTURE_TONE_TOKENS,
    }).toMatchSnapshot();
  });

  it.each(Object.entries(LECTURE_DURATION_TOKENS))(
    "%s 시간은 quick, normal, slow 순으로 길어진다",
    (_, { quick, normal, slow }) => {
      expect(quick).toBeLessThanOrEqual(normal);
      expect(normal).toBeLessThanOrEqual(slow);
    },
  );

  it("강도가 셀수록 확대 배율이 크다", () => {
    const { subtle, medium, strong } = LECTURE_INTENSITY_TOKENS;

    expect(subtle.focusMaxZoom).toBeLessThan(medium.focusMaxZoom);
    expect(medium.focusMaxZoom).toBeLessThan(strong.focusMaxZoom);
  });

  it("강도와 tone이 만든 값은 대본 highlight 스키마를 통과한다", () => {
    for (const { highlightStyle } of Object.values(LECTURE_INTENSITY_TOKENS)) {
      for (const tone of Object.values(LECTURE_TONE_TOKENS)) {
        const action = {
          type: "highlight",
          targetNodeIds: ["1"],
          durationMs: LECTURE_DURATION_TOKENS.emphasis.normal,
          style: highlightStyle,
          ...(tone === null ? {} : { tone }),
        };

        expect(lectureHighlightActionSchema.safeParse(action).success).toBe(
          true,
        );
      }
    }
  });
});
