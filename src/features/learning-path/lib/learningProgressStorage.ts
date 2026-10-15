import type { LearningPath, LearningProgress } from "../model/types";

const LEARNING_PROGRESS_STORAGE_KEY_PREFIX = "twig-tree:learning-progress:";

interface StoredLearningProgress extends LearningProgress {
  version: number;
}

/*
함수 이름 : getLearningProgressStorageKey
기능 : 워크스페이스와 학습 경로 버전에 고유한 localStorage 키를 만든다.
인자 : string workspaceId -> 워크스페이스 ID
LearningPath learningPath -> 학습 경로 ID와 버전
반환값 : localStorage 키
*/
export const getLearningProgressStorageKey = (
  workspaceId: string,
  learningPath: Pick<LearningPath, "id" | "version">,
): string =>
  `${LEARNING_PROGRESS_STORAGE_KEY_PREFIX}${workspaceId}:${learningPath.id}:${learningPath.version}`;

/*
함수 이름 : parseLearningProgress
기능 : 저장 문자열을 현재 학습 경로에서 사용할 수 있는 진행 상태로 변환한다. 잘못된 구조, 다른 버전, 경로에 없는 ID는 안전하게 정리한다.
인자 : string | null value -> localStorage에 저장된 문자열
LearningPath learningPath -> 복원할 현재 학습 경로
반환값 : 검증된 진행 상태. 저장값을 사용할 수 없으면 null
*/
export const parseLearningProgress = (
  value: string | null,
  learningPath: LearningPath,
): LearningProgress | null => {
  if (value === null) return null;

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== learningPath.version ||
      !("activeCheckpointId" in parsed) ||
      (parsed.activeCheckpointId !== null &&
        typeof parsed.activeCheckpointId !== "string") ||
      !("completedCheckpointIds" in parsed) ||
      !Array.isArray(parsed.completedCheckpointIds) ||
      !parsed.completedCheckpointIds.every(
        (checkpointId) => typeof checkpointId === "string",
      )
    ) {
      return null;
    }

    const checkpointIds = new Set(
      learningPath.checkpoints.map((checkpoint) => checkpoint.id),
    );
    const storedProgress = parsed as StoredLearningProgress;
    const activeCheckpointId =
      storedProgress.activeCheckpointId !== null &&
      checkpointIds.has(storedProgress.activeCheckpointId)
        ? storedProgress.activeCheckpointId
        : null;
    const completedCheckpointIds = Array.from(
      new Set(
        storedProgress.completedCheckpointIds.filter((checkpointId) =>
          checkpointIds.has(checkpointId),
        ),
      ),
    );

    return { activeCheckpointId, completedCheckpointIds };
  } catch {
    return null;
  }
};

/*
함수 이름 : readLearningProgress
기능 : 브라우저 저장소에서 현재 워크스페이스와 학습 경로의 진행 상태를 읽는다.
인자 : string workspaceId -> 워크스페이스 ID
LearningPath learningPath -> 복원할 학습 경로
반환값 : 검증된 진행 상태. 저장값이 없거나 접근할 수 없으면 null
*/
export const readLearningProgress = (
  workspaceId: string,
  learningPath: LearningPath,
): LearningProgress | null => {
  if (typeof window === "undefined") return null;

  try {
    return parseLearningProgress(
      window.localStorage.getItem(
        getLearningProgressStorageKey(workspaceId, learningPath),
      ),
      learningPath,
    );
  } catch {
    return null;
  }
};

/*
함수 이름 : writeLearningProgress
기능 : 현재 진행 상태를 버전과 함께 브라우저 저장소에 기록한다. 저장 실패는 현재 화면 진행을 막지 않는다.
인자 : string workspaceId -> 워크스페이스 ID
LearningPath learningPath -> 저장할 학습 경로
LearningProgress progress -> 저장할 진행 상태
반환값 : 없음
*/
export const writeLearningProgress = (
  workspaceId: string,
  learningPath: LearningPath,
  progress: LearningProgress,
): void => {
  if (typeof window === "undefined") return;

  const storedProgress: StoredLearningProgress = {
    version: learningPath.version,
    ...progress,
  };

  try {
    window.localStorage.setItem(
      getLearningProgressStorageKey(workspaceId, learningPath),
      JSON.stringify(storedProgress),
    );
  } catch {
    // 진행 상태는 메모리에서 계속 유지하고, 저장소를 다시 사용할 수 있을 때까지 영속화만 포기한다.
  }
};
