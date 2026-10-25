import type {
  LearningCheckpoint,
  LearningCheckpointStatus,
  LearningPath,
  LearningProgress,
  MainPathProgress,
} from "../model/types";

const getCompletedCheckpointIds = (
  progress: LearningProgress,
): ReadonlySet<string> => new Set(progress.completedCheckpointIds);

/*
함수 이름 : getLearningCheckpointStatus
기능 : 선수 조건과 현재 진행 상태를 바탕으로 체크포인트의 화면 상태를 계산한다.
인자 : LearningCheckpoint checkpoint -> 상태를 계산할 체크포인트
LearningProgress progress -> 현재 학습 진행 상태
반환값 : 체크포인트 상태
*/
export const getLearningCheckpointStatus = (
  checkpoint: LearningCheckpoint,
  progress: LearningProgress,
): LearningCheckpointStatus => {
  const completedCheckpointIds = getCompletedCheckpointIds(progress);

  if (completedCheckpointIds.has(checkpoint.id)) return "completed";
  if (progress.activeCheckpointId === checkpoint.id) return "current";

  return checkpoint.prerequisiteIds.every((prerequisiteId) =>
    completedCheckpointIds.has(prerequisiteId),
  )
    ? "available"
    : "locked";
};

/*
함수 이름 : getRecommendedNextCheckpoint
기능 : 기준 체크포인트가 가리키는 다음 권장 단계가 지금 이동 가능한지 확인해 반환한다.
인자 : LearningPath learningPath -> 전체 학습 경로
LearningProgress progress -> 현재 학습 진행 상태
string checkpointId -> 기준 체크포인트 ID
반환값 : 이동 가능한 다음 권장 체크포인트. 없거나 잠겨 있으면 null
*/
export const getRecommendedNextCheckpoint = (
  learningPath: LearningPath,
  progress: LearningProgress,
  checkpointId: string,
): LearningCheckpoint | null => {
  const checkpoint = learningPath.checkpoints.find(
    (candidate) => candidate.id === checkpointId,
  );

  if (checkpoint?.recommendedNextId === null || checkpoint === undefined) {
    return null;
  }

  const recommendedCheckpoint = learningPath.checkpoints.find(
    (candidate) => candidate.id === checkpoint.recommendedNextId,
  );

  if (!recommendedCheckpoint) return null;

  const status = getLearningCheckpointStatus(recommendedCheckpoint, progress);

  return status === "locked" ? null : recommendedCheckpoint;
};

/*
함수 이름 : getMainPathProgress
기능 : 보충·심화 단계를 제외한 핵심 경로의 완료 수와 진행률을 계산한다.
인자 : LearningPath learningPath -> 전체 학습 경로
LearningProgress progress -> 현재 학습 진행 상태
반환값 : 핵심 경로의 완료 수, 전체 수, 정수 백분율
*/
export const getMainPathProgress = (
  learningPath: LearningPath,
  progress: LearningProgress,
): MainPathProgress => {
  const mainCheckpoints = learningPath.checkpoints.filter(
    (checkpoint) => checkpoint.kind === "core",
  );
  const completedCheckpointIds = getCompletedCheckpointIds(progress);
  const completed = mainCheckpoints.filter((checkpoint) =>
    completedCheckpointIds.has(checkpoint.id),
  ).length;
  const total = mainCheckpoints.length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
};
