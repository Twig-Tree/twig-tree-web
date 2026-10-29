import type {
  FlashcardReviewRating,
  FlashcardReviewRecord,
} from "../model/types";

const MINIMUM_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.3;
const MINUTE_MS = 60 * 1_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const initialIntervals: Record<
  Exclude<FlashcardReviewRating, "again">,
  number
> = {
  hard: 1,
  good: 3,
  easy: 7,
};

const roundInterval = (days: number) => Math.round(days * 10) / 10;

const getNextIntervalDays = (
  current: FlashcardReviewRecord | null,
  rating: FlashcardReviewRating,
  easeFactor: number,
): number => {
  if (rating === "again") return 0;
  if (!current || current.intervalDays === 0) return initialIntervals[rating];

  if (rating === "hard") {
    return roundInterval(Math.max(1, current.intervalDays * 1.2));
  }

  if (rating === "good") {
    return roundInterval(Math.max(3, current.intervalDays * easeFactor));
  }

  return roundInterval(Math.max(7, current.intervalDays * (easeFactor + 0.5)));
};

const getNextEaseFactor = (
  current: FlashcardReviewRecord | null,
  rating: FlashcardReviewRating,
): number => {
  const easeFactor = current?.easeFactor ?? DEFAULT_EASE_FACTOR;

  if (rating === "again") {
    return Math.max(MINIMUM_EASE_FACTOR, easeFactor - 0.2);
  }

  if (rating === "hard") {
    return Math.max(MINIMUM_EASE_FACTOR, easeFactor - 0.15);
  }

  if (rating === "easy") return easeFactor + 0.15;
  return easeFactor;
};

/*
첫 복습은 10분/1일/3일/7일의 명시적인 간격을 사용하고, 이후에는 카드별 간격과
난이도 계수를 누적한다. 프로토타입에서 평가 동작과 복습 재등장을 검증하기 위한 규칙이다.
*/
export const scheduleFlashcardReview = (
  cardId: string,
  current: FlashcardReviewRecord | null,
  rating: FlashcardReviewRating,
  reviewedAt: Date,
): FlashcardReviewRecord => {
  const easeFactor = getNextEaseFactor(current, rating);
  const intervalDays = getNextIntervalDays(current, rating, easeFactor);
  const dueAt =
    reviewedAt.getTime() +
    (rating === "again" ? 10 * MINUTE_MS : intervalDays * DAY_MS);

  return {
    cardId,
    dueAt: new Date(dueAt).toISOString(),
    lastReviewedAt: reviewedAt.toISOString(),
    intervalDays,
    easeFactor,
    reviewCount: (current?.reviewCount ?? 0) + 1,
    lapseCount: (current?.lapseCount ?? 0) + (rating === "again" ? 1 : 0),
    lastRating: rating,
  };
};

export const isFlashcardDue = (
  record: FlashcardReviewRecord | undefined,
  now: Date,
): boolean => !record || Date.parse(record.dueAt) <= now.getTime();
