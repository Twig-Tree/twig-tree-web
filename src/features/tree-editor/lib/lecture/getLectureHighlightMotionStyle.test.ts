import { describe, expect, it } from "vitest";
import { getLectureHighlightMotionStyle } from "./getLectureHighlightMotionStyle";

describe("getLectureHighlightMotionStyle", () => {
  it("표시 시간을 주기로 나눠 끝날 때 원위치에 닿게 한다", () => {
    expect(getLectureHighlightMotionStyle("shake", 1200)).toEqual({
      "--lecture-highlight-cycle": "600ms",
      "--lecture-highlight-iterations": 2,
    });
  });

  it("표시 시간이 주기보다 짧으면 한 번을 그 시간에 맞춘다", () => {
    expect(getLectureHighlightMotionStyle("bounce", 300)).toEqual({
      "--lecture-highlight-cycle": "300ms",
      "--lecture-highlight-iterations": 1,
    });
  });

  it("끝이 정해지지 않았거나 반복하지 않는 스타일은 맞추지 않는다", () => {
    expect(getLectureHighlightMotionStyle("bounce", null)).toBeUndefined();
    expect(getLectureHighlightMotionStyle("pop", 650)).toBeUndefined();
    expect(getLectureHighlightMotionStyle(null, 650)).toBeUndefined();
  });
});
