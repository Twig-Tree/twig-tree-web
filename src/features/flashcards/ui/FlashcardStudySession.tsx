"use client";

import {
  ArrowLeft,
  Brain,
  CalendarClock,
  CheckCircle2,
  Layers3,
  Link2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/shared/ui/button/Button";
import { isFlashcardDue, scheduleFlashcardReview } from "../lib/reviewSchedule";
import {
  clearFlashcardReviews,
  readFlashcardReviews,
  writeFlashcardReviews,
} from "../lib/reviewStorage";
import type {
  FlashcardReviewRating,
  FlashcardReviewRecords,
  PrototypeFlashcard,
  PrototypeFlashcardKind,
  PrototypeFlashcardScenario,
} from "../model/types";

interface FlashcardStudySessionProps {
  workspaceId: string;
  scenario: PrototypeFlashcardScenario;
}

type SessionScreen = "overview" | "study" | "summary";

interface SessionResult {
  cardId: string;
  rating: FlashcardReviewRating;
}

const kindLabels: Record<PrototypeFlashcardKind, string> = {
  recall: "단순 회상",
  relation: "관계 암기",
  sequence: "순서 암기",
  collection: "묶음 회상",
};

const ratingOptions: Array<{
  rating: FlashcardReviewRating;
  label: string;
  hint: string;
  className: string;
}> = [
  {
    rating: "again",
    label: "다시",
    hint: "10분",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
  {
    rating: "hard",
    label: "어려움",
    hint: "1일",
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    rating: "good",
    label: "기억함",
    hint: "3일",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  },
  {
    rating: "easy",
    label: "쉬움",
    hint: "7일",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
];

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(date);

export function FlashcardStudySession({
  workspaceId,
  scenario,
}: FlashcardStudySessionProps) {
  const [records, setRecords] = useState<FlashcardReviewRecords>({});
  const [isReady, setIsReady] = useState(false);
  const [screen, setScreen] = useState<SessionScreen>("overview");
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setRecords(readFlashcardReviews(workspaceId, scenario));
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [scenario, workspaceId]);

  const now = new Date();
  const dueCards = scenario.cards.filter((card) =>
    isFlashcardDue(records[card.id], now),
  );
  const reviewedCount = scenario.cards.filter(
    (card) => records[card.id],
  ).length;
  const nextReviewAt = Object.values(records)
    .map((record) => new Date(record.dueAt))
    .filter((date) => date.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const currentCardId = queue[currentIndex];
  const currentCard = scenario.cards.find((card) => card.id === currentCardId);

  const startSession = (cards: PrototypeFlashcard[]) => {
    setQueue(cards.map((card) => card.id));
    setCurrentIndex(0);
    setIsRevealed(false);
    setSessionResults([]);
    setScreen("study");
  };

  const handleRate = (rating: FlashcardReviewRating) => {
    if (!currentCard) return;

    const nextRecord = scheduleFlashcardReview(
      currentCard.id,
      records[currentCard.id] ?? null,
      rating,
      new Date(),
    );
    const nextRecords = { ...records, [currentCard.id]: nextRecord };
    const nextResults = [...sessionResults, { cardId: currentCard.id, rating }];

    setRecords(nextRecords);
    setSessionResults(nextResults);
    writeFlashcardReviews(workspaceId, scenario, nextRecords);

    if (currentIndex >= queue.length - 1) {
      setScreen("summary");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setIsRevealed(false);
  };

  const handleReset = () => {
    clearFlashcardReviews(workspaceId, scenario.id);
    setRecords({});
    setQueue([]);
    setSessionResults([]);
    setScreen("overview");
  };

  if (screen === "study" && currentCard) {
    return (
      <StudyScreen
        scenario={scenario}
        card={currentCard}
        current={currentIndex + 1}
        total={queue.length}
        isRevealed={isRevealed}
        onReveal={() => setIsRevealed(true)}
        onRate={handleRate}
        onExit={() => setScreen("overview")}
      />
    );
  }

  if (screen === "summary") {
    return (
      <SummaryScreen
        results={sessionResults}
        onOverview={() => setScreen("overview")}
        onRestart={() => startSession(scenario.cards)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 lg:px-10 lg:py-10">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 px-7 py-8 text-white shadow-xl shadow-indigo-950/10 lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 ring-1 ring-white/15">
              <Sparkles aria-hidden="true" className="size-3.5" />
              오늘의 기억 훈련
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight lg:text-4xl">
              {scenario.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-indigo-100 lg:text-base">
              {scenario.learningGoal}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="전체 카드" value={scenario.cards.length} />
            <Stat label="오늘 복습" value={isReady ? dueCards.length : "-"} />
            <Stat label="학습 완료" value={reviewedCount} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
                Review queue
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {dueCards.length > 0
                  ? `${dueCards.length}장이 복습을 기다리고 있어요`
                  : "오늘 복습을 모두 마쳤어요"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                답을 먼저 떠올린 뒤 카드를 뒤집고 기억 상태를 직접 평가하세요.
              </p>
            </div>
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Brain aria-hidden="true" className="size-6" />
            </span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              variant="primary"
              className="h-12 w-full rounded-xl"
              disabled={!isReady || dueCards.length === 0}
              onClick={() => startSession(dueCards)}
            >
              <CalendarClock aria-hidden="true" className="size-4" />
              오늘 복습 {dueCards.length}장 시작
            </Button>
            <Button
              className="h-12 w-full rounded-xl"
              disabled={!isReady}
              onClick={() => startSession(scenario.cards)}
            >
              <Layers3 aria-hidden="true" className="size-4" />
              전체 카드 연습
            </Button>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-900">
              이 덱에서 연습하는 방식
            </h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(kindLabels).map(([kind, label]) => {
                const count = scenario.cards.filter(
                  (card) => card.kind === kind,
                ).length;
                if (count === 0) return null;

                return (
                  <div
                    key={kind}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {count}장
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">원본 트리</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {scenario.tree.description}
          </p>
          <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-slate-500">트리 노드</dt>
              <dd className="text-sm font-bold text-slate-900">
                {scenario.tree.nodes.length}개
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-slate-500">의미 관계</dt>
              <dd className="text-sm font-bold text-slate-900">
                {scenario.relations.length}개
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-slate-500">다음 복습</dt>
              <dd className="text-sm font-bold text-slate-900">
                {nextReviewAt ? formatDate(nextReviewAt) : "학습 후 계산"}
              </dd>
            </div>
          </dl>

          {reviewedCount > 0 ? (
            <button
              type="button"
              onClick={handleReset}
              className="mt-auto flex items-center justify-center gap-2 pt-8 text-xs font-semibold text-slate-400 transition-colors hover:text-rose-600"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              복습 기록 초기화
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-20 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-1 text-[10px] font-medium text-indigo-200">
        {label}
      </div>
    </div>
  );
}

interface StudyScreenProps {
  scenario: PrototypeFlashcardScenario;
  card: PrototypeFlashcard;
  current: number;
  total: number;
  isRevealed: boolean;
  onReveal: () => void;
  onRate: (rating: FlashcardReviewRating) => void;
  onExit: () => void;
}

function StudyScreen({
  scenario,
  card,
  current,
  total,
  isRevealed,
  onReveal,
  onRate,
  onExit,
}: StudyScreenProps) {
  const sourceNodes = useMemo(
    () =>
      card.sourceNodeIds.flatMap((nodeId) => {
        const node = scenario.tree.nodes.find(
          (candidate) => candidate.id === nodeId,
        );
        return node ? [node] : [];
      }),
    [card.sourceNodeIds, scenario.tree.nodes],
  );
  const sourceRelations = useMemo(
    () =>
      card.sourceRelationIds.flatMap((relationId) => {
        const relation = scenario.relations.find(
          (candidate) => candidate.id === relationId,
        );
        return relation ? [relation] : [];
      }),
    [card.sourceRelationIds, scenario.relations],
  );
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden px-6 py-5 lg:py-7">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onExit}
          aria-label="덱 개요로 돌아가기"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{scenario.title}</span>
            <span>
              {current} / {total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-[width]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <article className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-7 py-4">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            {kindLabels[card.kind]}
          </span>
          <span className="text-xs font-medium text-slate-400">
            먼저 머릿속으로 답해 보세요
          </span>
        </div>

        <div
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-7 text-center lg:px-16 ${isRevealed ? "justify-start py-7" : "justify-center py-8"}`}
        >
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Question
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-2xl leading-9 font-bold text-slate-900 lg:text-3xl">
            {card.front}
          </h2>

          {isRevealed ? (
            <div className="mt-7 shrink-0 border-t border-slate-100 pt-6 text-left">
              <p className="text-xs font-semibold tracking-wider text-indigo-500 uppercase">
                Answer
              </p>
              <p className="mt-3 text-lg leading-8 font-semibold text-slate-800">
                {card.back}
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Link2 aria-hidden="true" className="size-3.5" />
                  원본 트리 맥락
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sourceNodes.map((node) => (
                    <span
                      key={node.id}
                      className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      {node.label}
                    </span>
                  ))}
                </div>
                {sourceRelations.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-500">
                    {sourceRelations.map((relation) => (
                      <li key={relation.id}>· {relation.label}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              className="mx-auto mt-10 h-12 rounded-xl px-8"
              onClick={onReveal}
            >
              답 보기
            </Button>
          )}
        </div>
      </article>

      {isRevealed ? (
        <section aria-label="기억 상태 평가" className="mt-4 shrink-0 pb-1">
          <p className="mb-2 text-center text-xs font-medium text-slate-500">
            답을 얼마나 잘 기억했나요?
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ratingOptions.map((option) => (
              <button
                key={option.rating}
                type="button"
                onClick={() => onRate(option.rating)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${option.className}`}
              >
                <span className="block">{option.label}</span>
                <span className="mt-1 block text-[10px] font-medium opacity-70">
                  {option.hint} 후
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

interface SummaryScreenProps {
  results: SessionResult[];
  onOverview: () => void;
  onRestart: () => void;
}

function SummaryScreen({ results, onOverview, onRestart }: SummaryScreenProps) {
  const remembered = results.filter(
    (result) => result.rating === "good" || result.rating === "easy",
  ).length;
  const retry = results.filter((result) => result.rating === "again").length;

  return (
    <div className="mx-auto grid w-full max-w-3xl flex-1 place-items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 lg:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 aria-hidden="true" className="size-8" />
        </span>
        <p className="mt-6 text-xs font-bold tracking-wider text-emerald-600 uppercase">
          Session complete
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          오늘 복습을 마쳤어요
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          평가 결과에 따라 각 카드의 다음 복습일을 조정했습니다.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <SummaryStat label="복습 카드" value={results.length} />
          <SummaryStat label="기억함" value={remembered} />
          <SummaryStat label="다시 보기" value={retry} />
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11" onClick={onOverview}>
            덱 개요로
          </Button>
          <Button variant="primary" className="h-11" onClick={onRestart}>
            전체 덱 다시 연습
          </Button>
        </div>
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}
