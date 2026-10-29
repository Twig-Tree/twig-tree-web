import { afterEach, describe, expect, it } from "vitest";
import { renewableEnergyFlashcardScenario } from "../mock/sampleFlashcardScenarios";
import { scheduleFlashcardReview } from "./reviewSchedule";
import {
  clearFlashcardReviews,
  getFlashcardReviewStorageKey,
  readFlashcardReviews,
  writeFlashcardReviews,
} from "./reviewStorage";

afterEach(() => window.localStorage.clear());

describe("flashcard review storage", () => {
  it("시나리오별 복습 기록을 저장하고 복원한다", () => {
    const cardId = renewableEnergyFlashcardScenario.cards[0].id;
    const record = scheduleFlashcardReview(
      cardId,
      null,
      "good",
      new Date("2026-10-29T00:00:00.000Z"),
    );

    writeFlashcardReviews("1", renewableEnergyFlashcardScenario, {
      [cardId]: record,
    });

    expect(readFlashcardReviews("1", renewableEnergyFlashcardScenario)).toEqual(
      { [cardId]: record },
    );
  });

  it("현재 덱에 없는 카드와 손상된 기록은 버린다", () => {
    window.localStorage.setItem(
      getFlashcardReviewStorageKey("1", renewableEnergyFlashcardScenario.id),
      JSON.stringify({
        version: 1,
        scenarioId: renewableEnergyFlashcardScenario.id,
        records: {
          removed: { cardId: "removed" },
        },
      }),
    );

    expect(readFlashcardReviews("1", renewableEnergyFlashcardScenario)).toEqual(
      {},
    );
  });

  it("복습 기록을 초기화한다", () => {
    writeFlashcardReviews("1", renewableEnergyFlashcardScenario, {});

    clearFlashcardReviews("1", renewableEnergyFlashcardScenario.id);

    expect(
      window.localStorage.getItem(
        getFlashcardReviewStorageKey("1", renewableEnergyFlashcardScenario.id),
      ),
    ).toBeNull();
  });
});
