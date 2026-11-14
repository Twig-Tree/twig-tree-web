import { describe, expect, it } from "vitest";
import {
  getRevealedNarrationLength,
  NARRATION_REVEAL_RATIO,
} from "./getRevealedNarrationLength";

describe("getRevealedNarrationLength", () => {
  it("시작 전에는 글자를 보여 주지 않는다", () => {
    expect(getRevealedNarrationLength(10, 0, 1000)).toBe(0);
  });

  it("내레이션 시간의 정해진 비율에서 모든 글자를 보여 준다", () => {
    expect(
      getRevealedNarrationLength(10, 1000 * NARRATION_REVEAL_RATIO, 1000),
    ).toBe(10);
    expect(getRevealedNarrationLength(10, 5000, 1000)).toBe(10);
  });

  it("진행률만큼 글자를 올림해 보여 준다", () => {
    expect(
      getRevealedNarrationLength(
        10,
        1000 * NARRATION_REVEAL_RATIO * 0.31,
        1000,
      ),
    ).toBe(4);
  });

  it("내레이션 시간이 0이면 바로 모두 보여 준다", () => {
    expect(getRevealedNarrationLength(10, 0, 0)).toBe(10);
  });
});
