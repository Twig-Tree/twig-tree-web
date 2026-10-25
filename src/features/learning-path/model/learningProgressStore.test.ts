import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMainPathProgress } from "../lib/progress";
import {
  getLearningProgressStorageKey,
  readLearningProgress,
} from "../lib/learningProgressStorage";
import { sampleLearningPath } from "../mock/sampleLearningPath";
import { useLearningProgressStore } from "./learningProgressStore";

const WORKSPACE_ID = "42";

beforeEach(() => {
  useLearningProgressStore.setState({
    workspaceId: null,
    learningPath: null,
    activeCheckpointId: null,
    completedCheckpointIds: [],
  });
});

afterEach(() => {
  window.localStorage.clear();
});

describe("restoreProgress", () => {
  it("저장값이 없으면 빈 진행 상태로 시작한다", () => {
    useLearningProgressStore
      .getState()
      .restoreProgress(WORKSPACE_ID, sampleLearningPath);

    expect(useLearningProgressStore.getState()).toMatchObject({
      workspaceId: WORKSPACE_ID,
      learningPath: sampleLearningPath,
      activeCheckpointId: null,
      completedCheckpointIds: [],
    });
  });

  it("현재 워크스페이스의 저장된 진행 상태를 복원한다", () => {
    window.localStorage.setItem(
      getLearningProgressStorageKey(WORKSPACE_ID, sampleLearningPath),
      JSON.stringify({
        version: sampleLearningPath.version,
        activeCheckpointId: "renewable-fundamentals",
        completedCheckpointIds: ["transition-overview"],
      }),
    );

    useLearningProgressStore
      .getState()
      .restoreProgress(WORKSPACE_ID, sampleLearningPath);

    expect(useLearningProgressStore.getState()).toMatchObject({
      activeCheckpointId: "renewable-fundamentals",
      completedCheckpointIds: ["transition-overview"],
    });
  });
});

describe("learning progress actions", () => {
  beforeEach(() => {
    useLearningProgressStore
      .getState()
      .restoreProgress(WORKSPACE_ID, sampleLearningPath);
  });

  it("잠긴 체크포인트는 열거나 완료할 수 없다", () => {
    useLearningProgressStore.getState().openCheckpoint("variable-generation");
    useLearningProgressStore
      .getState()
      .completeCheckpoint("variable-generation");

    expect(useLearningProgressStore.getState()).toMatchObject({
      activeCheckpointId: null,
      completedCheckpointIds: [],
    });
  });

  it("체크포인트를 완료하면 저장하고 다음 핵심 단계로 이동한다", () => {
    useLearningProgressStore.getState().openCheckpoint("transition-overview");
    useLearningProgressStore
      .getState()
      .completeCheckpoint("transition-overview");

    expect(useLearningProgressStore.getState()).toMatchObject({
      activeCheckpointId: "renewable-fundamentals",
      completedCheckpointIds: ["transition-overview"],
    });
    expect(readLearningProgress(WORKSPACE_ID, sampleLearningPath)).toEqual({
      activeCheckpointId: "renewable-fundamentals",
      completedCheckpointIds: ["transition-overview"],
    });
  });

  it("선택 경로를 건너뛰고 핵심 경로를 끝까지 완료할 수 있다", () => {
    const mainCheckpointIds = [
      "transition-overview",
      "renewable-fundamentals",
      "variable-generation",
      "grid-flexibility",
      "transition-strategy",
    ];

    mainCheckpointIds.forEach((checkpointId) => {
      useLearningProgressStore.getState().completeCheckpoint(checkpointId);
    });

    const state = useLearningProgressStore.getState();

    expect(state.completedCheckpointIds).toEqual(mainCheckpointIds);
    expect(
      getMainPathProgress(sampleLearningPath, {
        activeCheckpointId: state.activeCheckpointId,
        completedCheckpointIds: state.completedCheckpointIds,
      }),
    ).toEqual({ completed: 5, total: 5, percentage: 100 });
  });

  it("열린 보충 경로를 완료하면 권장 핵심 경로로 돌아온다", () => {
    [
      "transition-overview",
      "renewable-fundamentals",
      "variable-generation",
    ].forEach((checkpointId) => {
      useLearningProgressStore.getState().completeCheckpoint(checkpointId);
    });

    useLearningProgressStore.getState().openCheckpoint("energy-storage");
    useLearningProgressStore.getState().completeCheckpoint("energy-storage");

    expect(useLearningProgressStore.getState()).toMatchObject({
      activeCheckpointId: "grid-flexibility",
      completedCheckpointIds: [
        "transition-overview",
        "renewable-fundamentals",
        "variable-generation",
        "energy-storage",
      ],
    });
  });

  it("초기화하면 현재 경로의 저장 상태도 비운다", () => {
    useLearningProgressStore
      .getState()
      .completeCheckpoint("transition-overview");

    useLearningProgressStore.getState().resetProgress();

    expect(useLearningProgressStore.getState()).toMatchObject({
      activeCheckpointId: null,
      completedCheckpointIds: [],
    });
    expect(readLearningProgress(WORKSPACE_ID, sampleLearningPath)).toEqual({
      activeCheckpointId: null,
      completedCheckpointIds: [],
    });
  });
});
