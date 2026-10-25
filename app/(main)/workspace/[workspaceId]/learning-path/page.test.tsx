import { act, fireEvent, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useLearningProgressStore,
  type LearningPath,
  type LearningProgress,
} from "@/src/features/learning-path";
import LearningPathPage from "./page";

vi.mock("@/src/features/learning-path", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/src/features/learning-path")>();

  return {
    ...actual,
    LearningPathGraph: ({
      learningPath,
      progress,
      onSelectCheckpoint,
    }: {
      learningPath: LearningPath;
      progress: LearningProgress;
      onSelectCheckpoint: (checkpointId: string) => void;
    }) => (
      <div data-testid="learning-path-graph">
        {learningPath.checkpoints.map((checkpoint) => {
          const status = actual.getLearningCheckpointStatus(
            checkpoint,
            progress,
          );
          const statusLabel = {
            completed: "완료",
            current: "학습 중",
            available: "학습 가능",
            locked: "선수 학습 필요",
          }[status];

          return (
            <button
              key={checkpoint.id}
              type="button"
              onClick={() => onSelectCheckpoint(checkpoint.id)}
              aria-label={`${checkpoint.title}, 핵심, ${statusLabel}`}
            />
          );
        })}
      </div>
    ),
  };
});

const renderPage = async (workspaceId: string) => {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <LearningPathPage params={Promise.resolve({ workspaceId })} />
      </Suspense>,
    );
  });
};

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

describe("LearningPathPage", () => {
  it.each(["abc", "0", "1.5"])(
    "워크스페이스 ID 형식이 잘못되면(%s) 찾을 수 없다고 안내한다",
    async (workspaceId) => {
      await renderPage(workspaceId);

      expect(
        screen.getByRole("heading", {
          name: "워크스페이스를 찾을 수 없습니다",
        }),
      ).toBeInTheDocument();
    },
  );

  it("백엔드 조회 없이 mock 학습 경로를 표시한다", async () => {
    await renderPage("42");

    expect(
      screen.getByRole("heading", { name: "학습 순서 제안 프로토타입" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "학습 의존성 그래프" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "학습 슬라이드" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "학습 경로" })).toHaveAttribute(
      "href",
      "/workspace/42/learning-path",
    );
    expect(screen.getByRole("link", { name: "UI 팔레트" })).toHaveAttribute(
      "href",
      "/prototype/learning-path-palette",
    );
  });

  it("첫 단계를 시작하고 완료하면 그래프와 슬라이드가 다음 단계로 함께 이동한다", async () => {
    await renderPage("42");

    fireEvent.click(screen.getByRole("button", { name: /첫 단계 시작/ }));

    expect(
      screen.getByRole("heading", { name: "에너지 전환의 큰 그림" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "에너지 전환의 큰 그림, 핵심, 학습 중",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /완료 및 다음/ }));

    expect(
      screen.getByRole("heading", { name: "재생 에너지의 기본 원리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "에너지 전환의 큰 그림, 핵심, 완료",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "핵심 경로 진행률" }),
    ).toHaveAttribute("aria-valuenow", "20");
  });

  it("진행 초기화로 저장 상태와 현재 단계를 비운다", async () => {
    await renderPage("42");
    fireEvent.click(screen.getByRole("button", { name: /첫 단계 시작/ }));
    fireEvent.click(screen.getByRole("button", { name: /완료 및 다음/ }));

    fireEvent.click(screen.getByRole("button", { name: "진행 초기화" }));

    expect(screen.getByText("학습 경로를 시작해 보세요")).toBeInTheDocument();
    expect(useLearningProgressStore.getState()).toMatchObject({
      activeCheckpointId: null,
      completedCheckpointIds: [],
    });
  });
});
