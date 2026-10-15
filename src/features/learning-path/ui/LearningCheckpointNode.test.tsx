import { fireEvent, render, screen } from "@testing-library/react";
import { ReactFlowProvider, type NodeProps } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { sampleLearningPath } from "../mock/sampleLearningPath";
import type { LearningCheckpointNode as LearningCheckpointNodeType } from "../model/graphTypes";
import type { LearningCheckpointStatus } from "../model/types";
import { LearningCheckpointNode } from "./LearningCheckpointNode";

const createNodeProps = (
  status: LearningCheckpointStatus,
  onSelect: (checkpointId: string) => void,
): NodeProps<LearningCheckpointNodeType> => ({
  id: "transition-overview",
  type: "learningCheckpoint",
  data: {
    checkpoint: sampleLearningPath.checkpoints[0],
    status,
    onSelect,
  },
  dragging: false,
  zIndex: 0,
  selectable: false,
  deletable: false,
  selected: false,
  draggable: false,
  isConnectable: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
});

describe("LearningCheckpointNode", () => {
  it.each([
    ["completed", "완료"],
    ["current", "학습 중"],
    ["available", "학습 가능"],
    ["locked", "선수 학습 필요"],
  ] as const)("%s 상태를 아이콘과 텍스트로 표시한다", (status, label) => {
    render(
      <ReactFlowProvider>
        <LearningCheckpointNode {...createNodeProps(status, vi.fn())} />
      </ReactFlowProvider>,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(`에너지 전환의 큰 그림, 핵심, ${label}`),
      }),
    ).toBeInTheDocument();
  });

  it("잠긴 노드도 선택 이벤트를 전달해 선수 단계 안내를 열 수 있다", () => {
    const onSelect = vi.fn();

    render(
      <ReactFlowProvider>
        <LearningCheckpointNode {...createNodeProps("locked", onSelect)} />
      </ReactFlowProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /에너지 전환의 큰 그림/ }),
    );

    expect(onSelect).toHaveBeenCalledWith("transition-overview");
  });
});
