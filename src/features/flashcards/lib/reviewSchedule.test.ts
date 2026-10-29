import { describe, expect, it } from "vitest";
import type { FlashcardReviewRecord } from "../model/types";
import { isFlashcardDue, scheduleFlashcardReview } from "./reviewSchedule";

const NOW = new Date("2026-10-29T00:00:00.000Z");

describe("scheduleFlashcardReview", () => {
  it.each([
    ["again", "2026-10-29T00:10:00.000Z", 0],
    ["hard", "2026-10-30T00:00:00.000Z", 1],
    ["good", "2026-11-01T00:00:00.000Z", 3],
    ["easy", "2026-11-05T00:00:00.000Z", 7],
  ] as const)(
    "첫 평가가 %s이면 초기 간격을 적용한다",
    (rating, dueAt, days) => {
      const result = scheduleFlashcardReview("card-1", null, rating, NOW);

      expect(result).toMatchObject({
        cardId: "card-1",
        dueAt,
        intervalDays: days,
        reviewCount: 1,
        lapseCount: rating === "again" ? 1 : 0,
        lastRating: rating,
      });
    },
  );

  it("기억함 평가는 기존 간격과 난이도 계수를 곱한다", () => {
    const current: FlashcardReviewRecord = {
      cardId: "card-1",
      dueAt: NOW.toISOString(),
      lastReviewedAt: "2026-10-20T00:00:00.000Z",
      intervalDays: 3,
      easeFactor: 2.3,
      reviewCount: 1,
      lapseCount: 0,
      lastRating: "good",
    };

    const result = scheduleFlashcardReview("card-1", current, "good", NOW);

    expect(result.intervalDays).toBe(6.9);
    expect(result.reviewCount).toBe(2);
    expect(result.lapseCount).toBe(0);
  });

  it("다시는 간격을 초기화하고 실패 횟수를 늘린다", () => {
    const current = scheduleFlashcardReview("card-1", null, "easy", NOW);
    const reviewedAt = new Date("2026-11-05T00:00:00.000Z");

    const result = scheduleFlashcardReview(
      "card-1",
      current,
      "again",
      reviewedAt,
    );

    expect(result.intervalDays).toBe(0);
    expect(result.dueAt).toBe("2026-11-05T00:10:00.000Z");
    expect(result.lapseCount).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.25);
  });
});

describe("isFlashcardDue", () => {
  it("기록이 없거나 예정 시각이 지났으면 복습 대상으로 본다", () => {
    expect(isFlashcardDue(undefined, NOW)).toBe(true);
    expect(
      isFlashcardDue(
        scheduleFlashcardReview(
          "card-1",
          null,
          "again",
          new Date("2026-10-28T23:00:00.000Z"),
        ),
        NOW,
      ),
    ).toBe(true);
  });

  it("예정 시각이 미래면 복습 대상이 아니다", () => {
    const record = scheduleFlashcardReview("card-1", null, "good", NOW);

    expect(isFlashcardDue(record, NOW)).toBe(false);
  });
});
