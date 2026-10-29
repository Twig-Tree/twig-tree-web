import type {
  FlashcardReviewRecord,
  FlashcardReviewRecords,
  PrototypeFlashcardScenario,
} from "../model/types";

const STORAGE_KEY_PREFIX = "twig-tree:flashcards";
const STORAGE_VERSION = 1;

interface StoredFlashcardReviews {
  version: number;
  scenarioId: string;
  records: FlashcardReviewRecords;
}

export const getFlashcardReviewStorageKey = (
  workspaceId: string,
  scenarioId: string,
) => `${STORAGE_KEY_PREFIX}:${workspaceId}:${scenarioId}`;

const isReviewRecord = (value: unknown): value is FlashcardReviewRecord => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<FlashcardReviewRecord>;

  return (
    typeof record.cardId === "string" &&
    typeof record.dueAt === "string" &&
    !Number.isNaN(Date.parse(record.dueAt)) &&
    typeof record.lastReviewedAt === "string" &&
    !Number.isNaN(Date.parse(record.lastReviewedAt)) &&
    typeof record.intervalDays === "number" &&
    typeof record.easeFactor === "number" &&
    typeof record.reviewCount === "number" &&
    typeof record.lapseCount === "number" &&
    ["again", "hard", "good", "easy"].includes(record.lastRating ?? "")
  );
};

export const readFlashcardReviews = (
  workspaceId: string,
  scenario: PrototypeFlashcardScenario,
): FlashcardReviewRecords => {
  try {
    const serialized = window.localStorage.getItem(
      getFlashcardReviewStorageKey(workspaceId, scenario.id),
    );
    if (!serialized) return {};

    const stored = JSON.parse(serialized) as Partial<StoredFlashcardReviews>;
    if (
      stored.version !== STORAGE_VERSION ||
      stored.scenarioId !== scenario.id ||
      !stored.records ||
      typeof stored.records !== "object"
    ) {
      return {};
    }

    const cardIds = new Set(scenario.cards.map((card) => card.id));

    return Object.fromEntries(
      Object.entries(stored.records).filter(
        ([cardId, record]) =>
          cardIds.has(cardId) &&
          isReviewRecord(record) &&
          record.cardId === cardId,
      ),
    );
  } catch {
    return {};
  }
};

export const writeFlashcardReviews = (
  workspaceId: string,
  scenario: PrototypeFlashcardScenario,
  records: FlashcardReviewRecords,
) => {
  const stored: StoredFlashcardReviews = {
    version: STORAGE_VERSION,
    scenarioId: scenario.id,
    records,
  };

  window.localStorage.setItem(
    getFlashcardReviewStorageKey(workspaceId, scenario.id),
    JSON.stringify(stored),
  );
};

export const clearFlashcardReviews = (
  workspaceId: string,
  scenarioId: string,
) => {
  window.localStorage.removeItem(
    getFlashcardReviewStorageKey(workspaceId, scenarioId),
  );
};
