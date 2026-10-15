import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GitBranch,
  LockKeyhole,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/src/shared/ui/button/Button";
import { IconButton } from "@/src/shared/ui/icon-button/IconButton";
import {
  getLearningCheckpointStatus,
  getMainPathProgress,
} from "../lib/progress";
import type {
  LearningCheckpoint,
  LearningCheckpointKind,
  LearningPath,
  LearningProgress,
} from "../model/types";

const kindLabels: Record<LearningCheckpointKind, string> = {
  core: "핵심 경로",
  supplemental: "보충 학습",
  advanced: "심화 학습",
};

interface LearningSlidePanelProps {
  learningPath: LearningPath;
  progress: LearningProgress;
  selectedCheckpointId: string | null;
  onSelectCheckpoint: (checkpointId: string) => void;
  onCompleteCheckpoint: (checkpointId: string) => void;
  onClose?: () => void;
}

const getCheckpointById = (
  learningPath: LearningPath,
  checkpointId: string | null,
): LearningCheckpoint | null =>
  checkpointId === null
    ? null
    : (learningPath.checkpoints.find(
        (checkpoint) => checkpoint.id === checkpointId,
      ) ?? null);

/*
함수 이름 : LearningSlidePanel
기능 : 선택한 학습 체크포인트의 설명과 진행 동작을 우측 슬라이드 패널로 제공한다.
인자 : LearningSlidePanelProps
반환값 : 학습 슬라이드 패널
*/
export function LearningSlidePanel({
  learningPath,
  progress,
  selectedCheckpointId,
  onSelectCheckpoint,
  onCompleteCheckpoint,
  onClose,
}: LearningSlidePanelProps) {
  const selectedCheckpoint = getCheckpointById(
    learningPath,
    selectedCheckpointId,
  );
  const mainProgress = getMainPathProgress(learningPath, progress);

  if (!selectedCheckpoint) {
    const firstCheckpoint = learningPath.checkpoints.find(
      (checkpoint) =>
        getLearningCheckpointStatus(checkpoint, progress) === "available",
    );

    return (
      <aside
        aria-label="학습 슬라이드"
        className="flex h-full w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-sm"
      >
        <PanelHeader title={learningPath.title} onClose={onClose} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen aria-hidden="true" className="size-7" />
          </span>
          <h2 className="text-xl font-semibold text-slate-900">
            학습 경로를 시작해 보세요
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            그래프에서 단계를 선택하거나 첫 번째 핵심 개념부터 차례로 학습할 수
            있습니다.
          </p>
          {firstCheckpoint ? (
            <Button
              variant="primary"
              className="mt-7"
              onClick={() => onSelectCheckpoint(firstCheckpoint.id)}
            >
              첫 단계 시작
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
        </div>
      </aside>
    );
  }

  const status = getLearningCheckpointStatus(selectedCheckpoint, progress);
  const prerequisiteCheckpoints = selectedCheckpoint.prerequisiteIds.flatMap(
    (checkpointId) => {
      const checkpoint = getCheckpointById(learningPath, checkpointId);

      return checkpoint ? [checkpoint] : [];
    },
  );
  const firstIncompletePrerequisite = prerequisiteCheckpoints.find(
    (checkpoint) => !progress.completedCheckpointIds.includes(checkpoint.id),
  );

  if (status === "locked") {
    return (
      <aside
        aria-label="학습 슬라이드"
        className="flex h-full w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-sm"
      >
        <PanelHeader title="잠긴 학습 단계" onClose={onClose} />
        <div className="flex min-h-0 flex-1 flex-col px-6 py-7">
          <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {kindLabels[selectedCheckpoint.kind]}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            {selectedCheckpoint.title}
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            이 단계를 시작하려면 아래 선수 학습을 먼저 완료해야 합니다.
          </p>
          <ul className="mt-5 space-y-2">
            {prerequisiteCheckpoints.map((checkpoint) => {
              const isCompleted = progress.completedCheckpointIds.includes(
                checkpoint.id,
              );

              return (
                <li
                  key={checkpoint.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700"
                >
                  {isCompleted ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-emerald-600"
                    />
                  ) : (
                    <LockKeyhole
                      aria-hidden="true"
                      className="size-4 text-slate-400"
                    />
                  )}
                  {checkpoint.title}
                </li>
              );
            })}
          </ul>
        </div>
        <footer className="shrink-0 border-t border-slate-200 p-5">
          <Button
            variant="primary"
            className="w-full"
            disabled={!firstIncompletePrerequisite}
            onClick={() => {
              if (firstIncompletePrerequisite) {
                onSelectCheckpoint(firstIncompletePrerequisite.id);
              }
            }}
          >
            선수 단계로 이동
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </footer>
      </aside>
    );
  }

  const previousCheckpoint = prerequisiteCheckpoints.at(0) ?? null;
  const recommendedCheckpoint = getCheckpointById(
    learningPath,
    selectedCheckpoint.recommendedNextId,
  );
  const optionalCheckpoints = learningPath.checkpoints.filter(
    (checkpoint) =>
      checkpoint.kind !== "core" &&
      checkpoint.prerequisiteIds.includes(selectedCheckpoint.id) &&
      getLearningCheckpointStatus(checkpoint, progress) !== "locked",
  );
  const isCompleted = status === "completed";
  const isLastCheckpoint = selectedCheckpoint.recommendedNextId === null;

  return (
    <aside
      aria-label="학습 슬라이드"
      className="flex h-full w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-sm"
    >
      <PanelHeader title={learningPath.title} onClose={onClose} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">핵심 경로 진행률</span>
            <span className="font-semibold text-slate-700">
              {mainProgress.completed}/{mainProgress.total} ·{" "}
              {mainProgress.percentage}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="핵심 경로 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={mainProgress.percentage}
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-[width]"
              style={{ width: `${mainProgress.percentage}%` }}
            />
          </div>
        </div>

        <article className="px-6 py-7">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {selectedCheckpoint.kind !== "core" ? (
                <Sparkles aria-hidden="true" className="size-3.5" />
              ) : null}
              {kindLabels[selectedCheckpoint.kind]}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                완료한 단계
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 text-2xl leading-8 font-semibold text-slate-900">
            {selectedCheckpoint.title}
          </h2>

          <section className="mt-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BookOpen aria-hidden="true" className="size-4 text-indigo-600" />
              핵심 개념
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {selectedCheckpoint.summary}
            </p>
          </section>

          <section className="mt-7 rounded-xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              왜 지금 배우나요?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedCheckpoint.rationale}
            </p>
          </section>

          <p className="mt-6 text-xs text-slate-400">
            분석 트리 노드 {selectedCheckpoint.sourceNodeIds.length}개와 연결됨
          </p>

          {optionalCheckpoints.length > 0 ? (
            <section className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <GitBranch
                  aria-hidden="true"
                  className="size-4 text-violet-600"
                />
                선택 학습
              </h3>
              <div className="mt-3 space-y-2">
                {optionalCheckpoints.map((checkpoint) => (
                  <button
                    key={checkpoint.id}
                    type="button"
                    onClick={() => onSelectCheckpoint(checkpoint.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-left text-sm font-medium text-violet-900 transition-colors hover:bg-violet-50"
                  >
                    <span>
                      <span className="block text-[10px] font-semibold tracking-wide text-violet-500 uppercase">
                        {kindLabels[checkpoint.kind]}
                      </span>
                      {checkpoint.title}
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-slate-200 p-5">
        <Button
          variant="secondary"
          aria-label="이전 선수 단계"
          disabled={!previousCheckpoint}
          onClick={() => {
            if (previousCheckpoint) onSelectCheckpoint(previousCheckpoint.id);
          }}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          이전
        </Button>

        {isCompleted ? (
          recommendedCheckpoint ? (
            <Button
              variant="primary"
              className="ml-auto"
              onClick={() => onSelectCheckpoint(recommendedCheckpoint.id)}
            >
              다음 단계
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          ) : (
            <Button variant="secondary" className="ml-auto" disabled>
              학습 완료
              <CheckCircle2 aria-hidden="true" className="size-4" />
            </Button>
          )
        ) : (
          <Button
            variant="primary"
            className="ml-auto"
            onClick={() => onCompleteCheckpoint(selectedCheckpoint.id)}
          >
            {isLastCheckpoint ? "학습 완료" : "완료 및 다음"}
            {isLastCheckpoint ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
          </Button>
        )}
      </footer>
    </aside>
  );
}

interface PanelHeaderProps {
  title: string;
  onClose?: () => void;
}

function PanelHeader({ title, onClose }: PanelHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          Learning Path
        </p>
        <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
      </div>
      {onClose ? (
        <IconButton size="sm" aria-label="학습 패널 닫기" onClick={onClose}>
          <X aria-hidden="true" />
        </IconButton>
      ) : null}
    </header>
  );
}
