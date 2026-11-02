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
    const result = getWorkspaceLabLayout("vertical").calculate({
      scenario: balancedScenario,
      spacing: balancedSpacing,
      fallbackNodeSize: comfortableNodeSize,
    });
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.y).toBeGreaterThan(root.position.y);
    expect(result.edges[0].sourceHandle).toBe(`source-${Position.Bottom}`);
    expect(result.edges[0].targetHandle).toBe(`target-${Position.Top}`);
  });

  it("가로 레이아웃은 자식을 부모 오른쪽에 배치한다", () => {
    const result = getWorkspaceLabLayout("horizontal").calculate({
      scenario: balancedScenario,
      spacing: balancedSpacing,
      fallbackNodeSize: comfortableNodeSize,
    });
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.x).toBeGreaterThan(root.position.x);
    expect(result.edges[0].sourceHandle).toBe(`source-${Position.Right}`);
    expect(result.edges[0].targetHandle).toBe(`target-${Position.Left}`);
  });

  it("방사형 레이아웃은 루트를 중심에 두고 가지를 여러 방향으로 펼친다", () => {
    const result = getWorkspaceLabLayout("radial").calculate({
      scenario: balancedScenario,
      spacing: balancedSpacing,
      fallbackNodeSize: comfortableNodeSize,
    });
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
        layout.calculate({
          scenario: emptyScenario,
          spacing: balancedSpacing,
          fallbackNodeSize: comfortableNodeSize,
        }),
      ).toEqual({ nodes: [], edges: [] });
    }
  });

  it("배치 간격 프리셋은 노드 밀도와 별개로 좌표 간격을 바꾼다", () => {
    const vertical = getWorkspaceLabLayout("vertical");
    const tight = vertical.calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: comfortableNodeSize,
    });
    const airy = vertical.calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("airy"),
      fallbackNodeSize: comfortableNodeSize,
    });

    expect(findNode(airy.nodes, "research").position.y).toBeGreaterThan(
      findNode(tight.nodes, "research").position.y,
    );
    expect(workspaceLabLayoutSpacings).toHaveLength(3);
  });

  it("큰 노드와 촘촘한 간격을 조합해도 형제 노드가 겹치지 않는다", () => {
    const spaciousNodeSize = { width: 168, height: 98 };
    const result = getWorkspaceLabLayout("vertical").calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: spaciousNodeSize,
    });
    const interview = findNode(result.nodes, "interview");
    const journey = findNode(result.nodes, "journey");

    expect(journey.position.x - interview.position.x).toBe(
      spaciousNodeSize.width + 12,
    );
  });

  it("세로 직각 연결선이 꺾일 최소 길이를 노드 사이에 보장한다", () => {
    const circleNodeSize = { width: 112, height: 112 };
    const result = getWorkspaceLabLayout("vertical").calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: circleNodeSize,
    });
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.y - root.position.y - circleNodeSize.height).toBe(
      workspaceLabSmoothStepMinimumGap,
    );
  });

  it("가로 레이아웃은 측정된 노드 폭 뒤에 연결선 최소 길이를 확보한다", () => {
    const tightSpacing = getWorkspaceLabLayoutSpacing("tight");
    const nodeSizes = new Map([
      ["root", { width: 236, height: 76 }],
      ["research", { width: 184, height: 76 }],
      ["structure", { width: 148, height: 96 }],
      ["visual", { width: 148, height: 76 }],
    ]);
    const result = getWorkspaceLabLayout("horizontal").calculate({
      scenario: balancedScenario,
      spacing: tightSpacing,
      fallbackNodeSize: comfortableNodeSize,
      nodeSizes,
    });
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.x - root.position.x - 236).toBe(
      Math.max(
        tightSpacing.horizontal.levelGap,
        workspaceLabSmoothStepMinimumGap,
      ),
    );
  });

  it("세로 레이아웃은 줄바꿈으로 높아진 노드 뒤에 연결선 최소 길이를 확보한다", () => {
    const nodeSizes = new Map([
      ["root", { width: 220, height: 132 }],
      ["research", { width: 148, height: 76 }],
    ]);
    const result = getWorkspaceLabLayout("vertical").calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: comfortableNodeSize,
      nodeSizes,
    });
    const root = findNode(result.nodes, "root");
    const research = findNode(result.nodes, "research");

    expect(research.position.y - root.position.y - 132).toBe(
      workspaceLabSmoothStepMinimumGap,
    );
  });

  it("측정된 형제 노드 크기가 달라도 subtree가 겹치지 않는다", () => {
    const nodeSizes = new Map([
      ["interview", { width: 220, height: 76 }],
      ["journey", { width: 120, height: 76 }],
    ]);
    const result = getWorkspaceLabLayout("vertical").calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: comfortableNodeSize,
      nodeSizes,
    });
    const interview = findNode(result.nodes, "interview");
    const journey = findNode(result.nodes, "journey");

    expect(
      journey.position.x - (interview.position.x + 220),
    ).toBeGreaterThanOrEqual(
      getWorkspaceLabLayoutSpacing("tight").vertical.siblingGap,
    );
  });

  it("가로 레이아웃에서 줄바꿈 높이가 다른 형제도 겹치지 않는다", () => {
    const tightSpacing = getWorkspaceLabLayoutSpacing("tight");
    const nodeSizes = new Map([
      ["research", { width: 148, height: 128 }],
      ["structure", { width: 148, height: 76 }],
      ["visual", { width: 148, height: 104 }],
    ]);
    const result = getWorkspaceLabLayout("horizontal").calculate({
      scenario: balancedScenario,
      spacing: tightSpacing,
      fallbackNodeSize: comfortableNodeSize,
      nodeSizes,
    });
    const research = findNode(result.nodes, "research");
    const structure = findNode(result.nodes, "structure");

    expect(
      structure.position.y - (research.position.y + 128),
    ).toBeGreaterThanOrEqual(tightSpacing.horizontal.siblingGap);
  });

  it("실시간 측정 높이가 바뀌면 세로 다음 단계 좌표도 다시 계산한다", () => {
    const vertical = getWorkspaceLabLayout("vertical");
    const before = vertical.calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: comfortableNodeSize,
      nodeSizes: new Map([["root", { width: 148, height: 76 }]]),
    });
    const after = vertical.calculate({
      scenario: balancedScenario,
      spacing: getWorkspaceLabLayoutSpacing("tight"),
      fallbackNodeSize: comfortableNodeSize,
      nodeSizes: new Map([["root", { width: 220, height: 124 }]]),
    });

    expect(findNode(after.nodes, "research").position.y).toBe(
      findNode(before.nodes, "research").position.y + 48,
    );
  });
});
