import { describe, expect, it } from "vitest";
import { sampleLearningPath } from "../mock/sampleLearningPath";
import type { LearningProgress } from "../model/types";
import {
  getLearningCheckpointStatus,
  getMainPathProgress,
  getRecommendedNextCheckpoint,
} from "./progress";

const getCheckpoint = (checkpointId: string) => {
  const checkpoint = sampleLearningPath.checkpoints.find(
    (candidate) => candidate.id === checkpointId,
  );

  if (!checkpoint) throw new Error(`Unknown checkpoint: ${checkpointId}`);

  return checkpoint;
};

describe("getLearningCheckpointStatus", () => {
  it("선수 단계가 없는 첫 체크포인트는 학습 가능하다", () => {
    expect(
      getLearningCheckpointStatus(getCheckpoint("transition-overview"), {
        activeCheckpointId: null,
        completedCheckpointIds: [],
      }),
    ).toBe("available");
  });

  it("선수 단계가 끝나지 않은 체크포인트는 잠긴다", () => {
    expect(
      getLearningCheckpointStatus(getCheckpoint("variable-generation"), {
        activeCheckpointId: null,
        completedCheckpointIds: ["transition-overview"],
      }),
    ).toBe("locked");
  });

  it("선수 단계를 모두 끝내면 체크포인트가 열린다", () => {
    expect(
      getLearningCheckpointStatus(getCheckpoint("renewable-fundamentals"), {
        activeCheckpointId: null,
        completedCheckpointIds: ["transition-overview"],
      }),
    ).toBe("available");
  });

  it("현재 단계와 완료 단계를 구분한다", () => {
    const currentProgress: LearningProgress = {
      activeCheckpointId: "transition-overview",
      completedCheckpointIds: [],
    };
    const completedProgress: LearningProgress = {
      activeCheckpointId: "transition-overview",
      completedCheckpointIds: ["transition-overview"],
    };

    expect(
      getLearningCheckpointStatus(
        getCheckpoint("transition-overview"),
        currentProgress,
      ),
    ).toBe("current");
    expect(
      getLearningCheckpointStatus(
        getCheckpoint("transition-overview"),
        completedProgress,
      ),
    ).toBe("completed");
  });
});

describe("getRecommendedNextCheckpoint", () => {
  it("완료로 잠금이 풀린 다음 핵심 단계를 반환한다", () => {
    const progress: LearningProgress = {
      activeCheckpointId: "transition-overview",
      completedCheckpointIds: ["transition-overview"],
    };

    expect(
      getRecommendedNextCheckpoint(
        sampleLearningPath,
        progress,
        "transition-overview",
      )?.id,
    ).toBe("renewable-fundamentals");
  });

  it("다음 권장 단계가 잠겨 있거나 없으면 null을 반환한다", () => {
    expect(
      getRecommendedNextCheckpoint(
        sampleLearningPath,
        { activeCheckpointId: null, completedCheckpointIds: [] },
        "transition-overview",
      ),
    ).toBeNull();
    expect(
      getRecommendedNextCheckpoint(
        sampleLearningPath,
        {
          activeCheckpointId: "transition-strategy",
          completedCheckpointIds: ["transition-strategy"],
        },
        "transition-strategy",
      ),
    ).toBeNull();
  });
});

describe("getMainPathProgress", () => {
  it("보충·심화 완료 여부는 핵심 경로 진행률에 포함하지 않는다", () => {
    expect(
      getMainPathProgress(sampleLearningPath, {
        activeCheckpointId: "grid-flexibility",
        completedCheckpointIds: [
          "transition-overview",
          "renewable-fundamentals",
          "variable-generation",
          "energy-storage",
          "policy-and-market",
        ],
      }),
    ).toEqual({ completed: 3, total: 5, percentage: 60 });
  });
});
