import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleLearningPath } from "../mock/sampleLearningPath";
import type { LearningProgress } from "../model/types";
import { LearningSlidePanel } from "./LearningSlidePanel";

const emptyProgress: LearningProgress = {
  activeCheckpointId: null,
  completedCheckpointIds: [],
};

interface RenderPanelOptions {
  progress?: LearningProgress;
  selectedCheckpointId?: string | null;
  onSelectCheckpoint?: (checkpointId: string) => void;
  onCompleteCheckpoint?: (checkpointId: string) => void;
  onClose?: () => void;
}

const renderPanel = ({
  progress = emptyProgress,
  selectedCheckpointId = null,
  onSelectCheckpoint = vi.fn(),
  onCompleteCheckpoint = vi.fn(),
  onClose,
}: RenderPanelOptions = {}) =>
  render(
    <LearningSlidePanel
      learningPath={sampleLearningPath}
      progress={progress}
      selectedCheckpointId={selectedCheckpointId}
      onSelectCheckpoint={onSelectCheckpoint}
      onCompleteCheckpoint={onCompleteCheckpoint}
      onClose={onClose}
    />,
  );

describe("LearningSlidePanel", () => {
  it("선택한 단계가 없으면 첫 학습을 시작하도록 안내한다", () => {
    const onSelectCheckpoint = vi.fn();

    renderPanel({ onSelectCheckpoint });
    fireEvent.click(screen.getByRole("button", { name: /첫 단계 시작/ }));

    expect(screen.getByText("학습 경로를 시작해 보세요")).toBeInTheDocument();
    expect(onSelectCheckpoint).toHaveBeenCalledWith("transition-overview");
  });

  it("선택한 단계의 설명, 학습 이유, 핵심 경로 진행률을 보여준다", () => {
    renderPanel({
      selectedCheckpointId: "variable-generation",
      progress: {
        activeCheckpointId: "variable-generation",
        completedCheckpointIds: [
          "transition-overview",
          "renewable-fundamentals",
        ],
      },
    });

    expect(screen.getByText("변동성 발전 이해하기")).toBeInTheDocument();
    expect(screen.getByText("핵심 개념")).toBeInTheDocument();
    expect(screen.getByText("왜 지금 배우나요?")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "핵심 경로 진행률" }),
    ).toHaveAttribute("aria-valuenow", "40");
  });

  it("완료 버튼으로 현재 체크포인트를 전달한다", () => {
    const onCompleteCheckpoint = vi.fn();

    renderPanel({
      selectedCheckpointId: "transition-overview",
      progress: {
        activeCheckpointId: "transition-overview",
        completedCheckpointIds: [],
      },
      onCompleteCheckpoint,
    });
    fireEvent.click(screen.getByRole("button", { name: /완료 및 다음/ }));

    expect(onCompleteCheckpoint).toHaveBeenCalledWith("transition-overview");
  });

  it("이전 버튼으로 직접 선수 단계에 돌아간다", () => {
    const onSelectCheckpoint = vi.fn();

    renderPanel({
      selectedCheckpointId: "renewable-fundamentals",
      progress: {
        activeCheckpointId: "renewable-fundamentals",
        completedCheckpointIds: ["transition-overview"],
      },
      onSelectCheckpoint,
    });
    fireEvent.click(screen.getByRole("button", { name: "이전 선수 단계" }));

    expect(onSelectCheckpoint).toHaveBeenCalledWith("transition-overview");
  });

  it("완료한 핵심 단계에서 열린 선택 경로에 진입할 수 있다", () => {
    const onSelectCheckpoint = vi.fn();

    renderPanel({
      selectedCheckpointId: "variable-generation",
      progress: {
        activeCheckpointId: "grid-flexibility",
        completedCheckpointIds: [
          "transition-overview",
          "renewable-fundamentals",
          "variable-generation",
        ],
      },
      onSelectCheckpoint,
    });
    fireEvent.click(
      screen.getByRole("button", { name: /에너지 저장 기술 보충/ }),
    );

    expect(screen.getByText("선택 학습")).toBeInTheDocument();
    expect(onSelectCheckpoint).toHaveBeenCalledWith("energy-storage");
  });

  it("잠긴 단계는 필요한 선수 단계를 안내하고 그 단계로 이동시킨다", () => {
    const onSelectCheckpoint = vi.fn();

    renderPanel({
      selectedCheckpointId: "transition-strategy",
      onSelectCheckpoint,
    });
    fireEvent.click(screen.getByRole("button", { name: /선수 단계로 이동/ }));

    expect(screen.getByText("잠긴 학습 단계")).toBeInTheDocument();
    expect(screen.getByText("유연한 전력망 설계")).toBeInTheDocument();
    expect(onSelectCheckpoint).toHaveBeenCalledWith("grid-flexibility");
  });

  it("완료한 단계에서는 다시 완료하지 않고 다음 권장 단계로 이동한다", () => {
    const onSelectCheckpoint = vi.fn();

    renderPanel({
      selectedCheckpointId: "transition-overview",
      progress: {
        activeCheckpointId: "renewable-fundamentals",
        completedCheckpointIds: ["transition-overview"],
      },
      onSelectCheckpoint,
    });
    fireEvent.click(screen.getByRole("button", { name: /다음 단계/ }));

    expect(screen.getByText("완료한 단계")).toBeInTheDocument();
    expect(onSelectCheckpoint).toHaveBeenCalledWith("renewable-fundamentals");
  });

  it("닫기 동작이 제공되면 헤더에 닫기 버튼을 표시한다", () => {
    const onClose = vi.fn();

    renderPanel({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "학습 패널 닫기" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
