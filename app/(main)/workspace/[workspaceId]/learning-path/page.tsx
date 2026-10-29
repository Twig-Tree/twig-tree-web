"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Shapes } from "lucide-react";
import {
  getLearningCheckpointStatus,
  LearningPathGraph,
  LearningSlidePanel,
  sampleLearningPath,
  useLearningProgressStore,
  type LearningProgress,
} from "@/src/features/learning-path";
import { routes } from "@/src/shared/config/routes";
import { isValidApiId } from "@/src/shared/lib/validation/isValidApiId";
import { WorkspaceHeader, WorkspaceLoadError } from "@/src/widgets/workspace";

const EMPTY_PROGRESS: LearningProgress = {
  activeCheckpointId: null,
  completedCheckpointIds: [],
};

interface LearningPathPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function LearningPathPage({ params }: LearningPathPageProps) {
  const { workspaceId } = use(params);

  if (!isValidApiId(workspaceId)) {
    return <WorkspaceLoadError isNotFound />;
  }

  return (
    <LearningPathPageContent key={workspaceId} workspaceId={workspaceId} />
  );
}

interface LearningPathPageContentProps {
  workspaceId: string;
}

function LearningPathPageContent({
  workspaceId,
}: LearningPathPageContentProps) {
  const storedWorkspaceId = useLearningProgressStore(
    (state) => state.workspaceId,
  );
  const activeCheckpointId = useLearningProgressStore(
    (state) => state.activeCheckpointId,
  );
  const completedCheckpointIds = useLearningProgressStore(
    (state) => state.completedCheckpointIds,
  );
  const restoreProgress = useLearningProgressStore(
    (state) => state.restoreProgress,
  );
  const openCheckpoint = useLearningProgressStore(
    (state) => state.openCheckpoint,
  );
  const completeCheckpoint = useLearningProgressStore(
    (state) => state.completeCheckpoint,
  );
  const resetProgress = useLearningProgressStore(
    (state) => state.resetProgress,
  );
  const [previewCheckpointId, setPreviewCheckpointId] = useState<string | null>(
    null,
  );
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    restoreProgress(workspaceId, sampleLearningPath);
  }, [restoreProgress, workspaceId]);

  /*
  다른 워크스페이스의 store 상태가 남아 있는 첫 렌더에서는 빈 진행 상태를 사용한다.
  effect가 현재 workspaceId의 localStorage를 복원하면 같은 화면에서 실제 진행 상태로 바뀐다.
  */
  const progress: LearningProgress = useMemo(
    () =>
      storedWorkspaceId === workspaceId
        ? { activeCheckpointId, completedCheckpointIds }
        : EMPTY_PROGRESS,
    [
      activeCheckpointId,
      completedCheckpointIds,
      storedWorkspaceId,
      workspaceId,
    ],
  );
  const selectedCheckpointId =
    previewCheckpointId ?? progress.activeCheckpointId;

  const handleSelectCheckpoint = useCallback(
    (checkpointId: string) => {
      const checkpoint = sampleLearningPath.checkpoints.find(
        (candidate) => candidate.id === checkpointId,
      );

      if (!checkpoint) return;

      setIsPanelOpen(true);

      if (getLearningCheckpointStatus(checkpoint, progress) === "locked") {
        setPreviewCheckpointId(checkpointId);
        return;
      }

      setPreviewCheckpointId(null);
      openCheckpoint(checkpointId);
    },
    [openCheckpoint, progress],
  );

  const handleCompleteCheckpoint = useCallback(
    (checkpointId: string) => {
      setPreviewCheckpointId(null);
      completeCheckpoint(checkpointId);
    },
    [completeCheckpoint],
  );

  const handleResetProgress = () => {
    setPreviewCheckpointId(null);
    resetProgress();
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      <WorkspaceHeader
        name="학습 순서 제안 프로토타입"
        actions={
          <div className="flex items-center gap-3">
            <nav
              aria-label="워크스페이스 화면 전환"
              className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold"
            >
              <Link
                href={routes.workspace(workspaceId)}
                className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-900"
              >
                트리 보기
              </Link>
              <Link
                href={routes.learningPath(workspaceId)}
                aria-current="page"
                className="rounded-md bg-white px-3 py-1.5 text-indigo-700 shadow-sm"
              >
                학습 경로
              </Link>
              <Link
                href={routes.flashcards(workspaceId)}
                className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-900"
              >
                플래시카드
              </Link>
            </nav>
            <Link
              href={routes.learningPathPalette}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Shapes aria-hidden="true" className="size-3.5" />
              UI 팔레트
            </Link>
            <button
              type="button"
              onClick={handleResetProgress}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              진행 초기화
            </button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1">
        <section
          aria-label="학습 의존성 그래프"
          className="min-h-0 min-w-0 flex-1"
        >
          <LearningPathGraph
            key={isPanelOpen ? "panel-open" : "panel-closed"}
            learningPath={sampleLearningPath}
            progress={progress}
            onSelectCheckpoint={handleSelectCheckpoint}
          />
        </section>

        {isPanelOpen ? (
          <LearningSlidePanel
            learningPath={sampleLearningPath}
            progress={progress}
            selectedCheckpointId={selectedCheckpointId}
            onSelectCheckpoint={handleSelectCheckpoint}
            onCompleteCheckpoint={handleCompleteCheckpoint}
            onClose={() => setIsPanelOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="h-full w-12 shrink-0 border-l border-slate-200 bg-white text-xs font-semibold tracking-wider text-slate-500 [writing-mode:vertical-rl] hover:bg-slate-50 hover:text-indigo-700"
          >
            학습 패널 열기
          </button>
        )}
      </div>
    </div>
  );
}
