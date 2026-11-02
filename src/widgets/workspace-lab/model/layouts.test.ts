import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { workspaceLabScenarios } from "./scenarios";
import { workspaceLabSmoothStepMinimumGap } from "./edge-routing";
import {
  getWorkspaceLabLayout,
  getWorkspaceLabLayoutSpacing,
  workspaceLabLayouts,
  workspaceLabLayoutSpacings,
} from "./layouts";

const balancedScenario = workspaceLabScenarios.find(
  (scenario) => scenario.id === "balanced",
)!;
const balancedSpacing = getWorkspaceLabLayoutSpacing("balanced");
const comfortableNodeSize = { width: 148, height: 76 };

const findNode = (
  nodes: ReturnType<(typeof workspaceLabLayouts)[number]["calculate"]>["nodes"],
  id: string,
) => nodes.find((node) => node.id === id)!;

describe("workspaceLabLayouts", () => {
  it("레이아웃 ID가 서로 겹치지 않는다", () => {
    const ids = workspaceLabLayouts.map((layout) => layout.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("세로 레이아웃은 자식을 부모 아래에 배치한다", () => {
    const result = getWorkspaceLabLayout("vertical").calculate(
      balancedScenario,
      balancedSpacing,
      comfortableNodeSize,
    );
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.y).toBeGreaterThan(root.position.y);
    expect(result.edges[0].sourceHandle).toBe(`source-${Position.Bottom}`);
    expect(result.edges[0].targetHandle).toBe(`target-${Position.Top}`);
  });

  it("가로 레이아웃은 자식을 부모 오른쪽에 배치한다", () => {
    const result = getWorkspaceLabLayout("horizontal").calculate(
      balancedScenario,
      balancedSpacing,
      comfortableNodeSize,
    );
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.x).toBeGreaterThan(root.position.x);
    expect(result.edges[0].sourceHandle).toBe(`source-${Position.Right}`);
    expect(result.edges[0].targetHandle).toBe(`target-${Position.Left}`);
  });

  it("방사형 레이아웃은 루트를 중심에 두고 가지를 여러 방향으로 펼친다", () => {
    const result = getWorkspaceLabLayout("radial").calculate(
      balancedScenario,
      balancedSpacing,
      comfortableNodeSize,
    );
    const root = findNode(result.nodes, "root");
    const firstLevel = ["research", "structure", "visual"].map((id) =>
      findNode(result.nodes, id),
    );

    expect(root.position).toEqual({ x: -74, y: -38 });
    expect(
      new Set(firstLevel.map((node) => `${node.position.x}:${node.position.y}`))
        .size,
    ).toBe(3);
    expect(firstLevel.some((node) => node.position.x < root.position.x)).toBe(
      true,
    );
    expect(firstLevel.some((node) => node.position.x > root.position.x)).toBe(
      true,
    );
    expect(result.edges.every((edge) => edge.data?.path === "bezier")).toBe(
      true,
    );
    expect(result.edges.every((edge) => edge.sourceHandle)).toBe(true);
    expect(result.edges.every((edge) => edge.targetHandle)).toBe(true);
  });

  it("빈 시나리오도 모든 레이아웃에서 안전하게 계산한다", () => {
    const emptyScenario = workspaceLabScenarios.find(
      (scenario) => scenario.id === "empty",
    )!;

    for (const layout of workspaceLabLayouts) {
      expect(
        layout.calculate(emptyScenario, balancedSpacing, comfortableNodeSize),
      ).toEqual({ nodes: [], edges: [] });
    }
  });

  it("배치 간격 프리셋은 노드 밀도와 별개로 좌표 간격을 바꾼다", () => {
    const vertical = getWorkspaceLabLayout("vertical");
    const tight = vertical.calculate(
      balancedScenario,
      getWorkspaceLabLayoutSpacing("tight"),
      comfortableNodeSize,
    );
    const airy = vertical.calculate(
      balancedScenario,
      getWorkspaceLabLayoutSpacing("airy"),
      comfortableNodeSize,
    );

    expect(findNode(airy.nodes, "research").position.y).toBeGreaterThan(
      findNode(tight.nodes, "research").position.y,
    );
    expect(workspaceLabLayoutSpacings).toHaveLength(3);
  });

  it("큰 노드와 촘촘한 간격을 조합해도 형제 노드가 겹치지 않는다", () => {
    const spaciousNodeSize = { width: 168, height: 98 };
    const result = getWorkspaceLabLayout("vertical").calculate(
      balancedScenario,
      getWorkspaceLabLayoutSpacing("tight"),
      spaciousNodeSize,
    );
    const interview = findNode(result.nodes, "interview");
    const journey = findNode(result.nodes, "journey");

    expect(journey.position.x - interview.position.x).toBe(
      spaciousNodeSize.width + 12,
    );
  });

  it("세로 직각 연결선이 꺾일 최소 길이를 노드 사이에 보장한다", () => {
    const circleNodeSize = { width: 112, height: 112 };
    const result = getWorkspaceLabLayout("vertical").calculate(
      balancedScenario,
      getWorkspaceLabLayoutSpacing("tight"),
      circleNodeSize,
    );
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.y - root.position.y - circleNodeSize.height).toBe(
      workspaceLabSmoothStepMinimumGap,
    );
  });
});
