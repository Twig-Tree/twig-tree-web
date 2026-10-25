import { create } from "zustand";
import {
  getLearningCheckpointStatus,
  getRecommendedNextCheckpoint,
} from "../lib/progress";
import {
  readLearningProgress,
  writeLearningProgress,
} from "../lib/learningProgressStorage";
import type { LearningPath, LearningProgress } from "./types";

interface LearningProgressState extends LearningProgress {
  workspaceId: string | null;
  learningPath: LearningPath | null;
  restoreProgress: (workspaceId: string, learningPath: LearningPath) => void;
  openCheckpoint: (checkpointId: string) => void;
  completeCheckpoint: (checkpointId: string) => void;
  resetProgress: () => void;
}

const EMPTY_PROGRESS: LearningProgress = {
  activeCheckpointId: null,
  completedCheckpointIds: [],
};

/*
학습 경로 진행 상태는 서버 데이터와 분리한다. 프로토타입 동안 고정 경로를 사용하고,
워크스페이스와 경로 버전을 기준으로 localStorage에 저장해 새로고침 후에도 이어서 학습한다.
*/
export const useLearningProgressStore = create<LearningProgressState>()((
  set,
  get,
) => {
  const saveProgress = (progress: LearningProgress): void => {
    const { workspaceId, learningPath } = get();

    set(progress);

    if (workspaceId !== null && learningPath !== null) {
      writeLearningProgress(workspaceId, learningPath, progress);
    }
  };

  return {
    workspaceId: null,
    learningPath: null,
    ...EMPTY_PROGRESS,

    restoreProgress: (workspaceId, learningPath) => {
      const savedProgress =
        readLearningProgress(workspaceId, learningPath) ?? EMPTY_PROGRESS;

      set({ workspaceId, learningPath, ...savedProgress });
    },

    openCheckpoint: (checkpointId) => {
      const { learningPath, activeCheckpointId, completedCheckpointIds } =
        get();
      const checkpoint = learningPath?.checkpoints.find(
        (candidate) => candidate.id === checkpointId,
      );

      if (!learningPath || !checkpoint) return;

      const progress = { activeCheckpointId, completedCheckpointIds };

      if (getLearningCheckpointStatus(checkpoint, progress) === "locked") {
        return;
      }

      saveProgress({ ...progress, activeCheckpointId: checkpointId });
    },

    completeCheckpoint: (checkpointId) => {
      const { learningPath, activeCheckpointId, completedCheckpointIds } =
        get();
      const checkpoint = learningPath?.checkpoints.find(
        (candidate) => candidate.id === checkpointId,
      );

      if (!learningPath || !checkpoint) return;

      const currentProgress = { activeCheckpointId, completedCheckpointIds };

      if (
        getLearningCheckpointStatus(checkpoint, currentProgress) === "locked"
      ) {
        return;
      }

      const completedProgress: LearningProgress = {
        activeCheckpointId: checkpointId,
        completedCheckpointIds: Array.from(
          new Set([...completedCheckpointIds, checkpointId]),
        ),
      };
      const recommendedCheckpoint = getRecommendedNextCheckpoint(
        learningPath,
        completedProgress,
        checkpointId,
      );

      saveProgress({
        ...completedProgress,
        activeCheckpointId: recommendedCheckpoint?.id ?? checkpointId,
      });
    },

    resetProgress: () => {
      saveProgress(EMPTY_PROGRESS);
    },
  };
});
