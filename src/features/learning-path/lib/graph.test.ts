import { describe, expect, it, vi } from "vitest";
import { sampleLearningPath } from "../mock/sampleLearningPath";
import {
  createLearningPathGraphElements,
  layoutLearningPathGraph,
} from "./graph";

describe("createLearningPathGraphElements", () => {
  it("모든 체크포인트와 선수 관계를 노드와 edge로 변환한다", () => {
    const { nodes, edges } = createLearningPathGraphElements(
      sampleLearningPath,
      {
        activeCheckpointId: "renewable-fundamentals",
        completedCheckpointIds: ["transition-overview"],
      },
      vi.fn(),
    );

    expect(nodes).toHaveLength(7);
    expect(edges).toHaveLength(6);
    expect(
      nodes.find((node) => node.id === "transition-overview")?.data.status,
    ).toBe("completed");
    expect(
      nodes.find((node) => node.id === "renewable-fundamentals")?.data.status,
    ).toBe("current");
    expect(
      nodes.find((node) => node.id === "transition-strategy")?.data.status,
    ).toBe("locked");
  });

  it("보충·심화 경로의 edge만 선택 경로로 표시한다", () => {
    const { edges } = createLearningPathGraphElements(
      sampleLearningPath,
      { activeCheckpointId: null, completedCheckpointIds: [] },
      vi.fn(),
    );
    const optionalEdgeIds = edges
      .filter((edge) => edge.data?.isOptional)
      .map((edge) => edge.id);

    expect(optionalEdgeIds).toEqual([
      "variable-generation->energy-storage",
      "grid-flexibility->policy-and-market",
    ]);
  });

  it("경로에 없는 선수 ID는 깨진 edge를 만들지 않는다", () => {
    const learningPath = {
      ...sampleLearningPath,
      checkpoints: sampleLearningPath.checkpoints.map((checkpoint) =>
        checkpoint.id === "transition-overview"
          ? { ...checkpoint, prerequisiteIds: ["removed-checkpoint"] }
          : checkpoint,
      ),
    };
    const { edges } = createLearningPathGraphElements(
      learningPath,
      { activeCheckpointId: null, completedCheckpointIds: [] },
      vi.fn(),
    );

    expect(edges.some((edge) => edge.source === "removed-checkpoint")).toBe(
      false,
    );
  });
});

describe("layoutLearningPathGraph", () => {
  it("모든 의존 관계의 다음 노드를 오른쪽에 배치한다", async () => {
    const graph = createLearningPathGraphElements(
      sampleLearningPath,
      { activeCheckpointId: null, completedCheckpointIds: [] },
      vi.fn(),
    );
    const layouted = await layoutLearningPathGraph(graph.nodes, graph.edges);
    const nodeById = new Map(layouted.nodes.map((node) => [node.id, node]));

    layouted.edges.forEach((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);

      expect(source).toBeDefined();
      expect(target).toBeDefined();
      expect(target!.position.x).toBeGreaterThan(source!.position.x);
    });
    expect(layouted.nodes.every((node) => node.width === 224)).toBe(true);
    expect(layouted.nodes.every((node) => node.height === 124)).toBe(true);
  });
});
