import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleLearningPath } from "../mock/sampleLearningPath";
import {
  getLearningProgressStorageKey,
  parseLearningProgress,
  readLearningProgress,
  writeLearningProgress,
} from "./learningProgressStorage";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("parseLearningProgress", () => {
  it("현재 경로에 있는 ID만 남기고 중복 완료 ID를 제거한다", () => {
    expect(
      parseLearningProgress(
        JSON.stringify({
          version: sampleLearningPath.version,
          activeCheckpointId: "removed-checkpoint",
          completedCheckpointIds: [
            "transition-overview",
            "transition-overview",
            "removed-checkpoint",
          ],
        }),
        sampleLearningPath,
      ),
    ).toEqual({
      activeCheckpointId: null,
      completedCheckpointIds: ["transition-overview"],
    });
  });

  it.each([
    ["JSON이 아닌 값", "{"],
    [
      "다른 경로 버전",
      JSON.stringify({
        version: 99,
        activeCheckpointId: null,
        completedCheckpointIds: [],
      }),
    ],
    [
      "잘못된 완료 목록",
      JSON.stringify({
        version: 1,
        activeCheckpointId: null,
        completedCheckpointIds: [3],
      }),
    ],
  ])("%s은 사용할 수 없는 저장값으로 본다", (_, value) => {
    expect(parseLearningProgress(value, sampleLearningPath)).toBeNull();
  });
});

describe("learning progress storage", () => {
  it("워크스페이스와 경로 버전별 키에 진행 상태를 저장하고 읽는다", () => {
    const progress = {
      activeCheckpointId: "renewable-fundamentals",
      completedCheckpointIds: ["transition-overview"],
    };

    writeLearningProgress("42", sampleLearningPath, progress);

    expect(
      window.localStorage.getItem(
        getLearningProgressStorageKey("42", sampleLearningPath),
      ),
    ).toBe(
      JSON.stringify({ version: sampleLearningPath.version, ...progress }),
    );
    expect(readLearningProgress("42", sampleLearningPath)).toEqual(progress);
  });

  it("localStorage 읽기와 쓰기가 실패해도 예외를 전파하지 않는다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readLearningProgress("42", sampleLearningPath)).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() =>
      writeLearningProgress("42", sampleLearningPath, {
        activeCheckpointId: null,
        completedCheckpointIds: [],
      }),
    ).not.toThrow();
  });
});
