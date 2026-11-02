import { Position } from "@xyflow/react";
import type {
  WorkspaceLabEdge,
  WorkspaceLabNode,
  WorkspaceLabScenario,
} from "./types";

type LayoutResult = {
  nodes: WorkspaceLabNode[];
  edges: WorkspaceLabEdge[];
};

export interface WorkspaceLabLayoutDefinition {
  id: string;
  name: string;
  description: string;
  calculate: (scenario: WorkspaceLabScenario) => LayoutResult;
}

type TreeMetrics = {
  depthById: Map<string, number>;
  slotById: Map<string, number>;
  leafCount: number;
};

const oppositePosition: Record<Position, Position> = {
  [Position.Top]: Position.Bottom,
  [Position.Right]: Position.Left,
  [Position.Bottom]: Position.Top,
  [Position.Left]: Position.Right,
};

const getHandleId = (type: "source" | "target", position: Position) =>
  `${type}-${position}`;

const getChildrenById = (
  nodes: WorkspaceLabNode[],
  edges: WorkspaceLabEdge[],
) => {
  const childrenById = new Map<string, string[]>();

  for (const node of nodes) childrenById.set(node.id, []);
  for (const edge of edges) childrenById.get(edge.source)?.push(edge.target);

  return childrenById;
};

/*
리프를 왼쪽부터 슬롯에 놓고, 부모는 자식 슬롯의 평균에 둔다.
세로·가로는 이 슬롯을 축으로 사용하고 방사형은 각도로 변환한다.
*/
const getTreeMetrics = (
  nodes: WorkspaceLabNode[],
  edges: WorkspaceLabEdge[],
): TreeMetrics => {
  const childrenById = getChildrenById(nodes, edges);
  const targetIds = new Set(edges.map((edge) => edge.target));
  const roots = nodes.filter((node) => !targetIds.has(node.id));
  const depthById = new Map<string, number>();
  const slotById = new Map<string, number>();
  const visited = new Set<string>();
  let nextLeafSlot = 0;

  const visit = (id: string, depth: number, lineage: Set<string>): number => {
    if (lineage.has(id)) {
      const cycleSlot = nextLeafSlot++;
      slotById.set(id, cycleSlot);
      return cycleSlot;
    }

    if (visited.has(id)) return slotById.get(id) ?? nextLeafSlot;

    visited.add(id);
    depthById.set(id, depth);

    const nextLineage = new Set(lineage).add(id);
    const children = (childrenById.get(id) ?? []).filter(
      (childId) => !nextLineage.has(childId),
    );

    if (children.length === 0) {
      const leafSlot = nextLeafSlot++;
      slotById.set(id, leafSlot);
      return leafSlot;
    }

    const childSlots = children.map((childId) =>
      visit(childId, depth + 1, nextLineage),
    );
    const parentSlot =
      childSlots.reduce((sum, slot) => sum + slot, 0) / childSlots.length;

    slotById.set(id, parentSlot);
    return parentSlot;
  };

  const startNodes = roots.length > 0 ? roots : nodes.slice(0, 1);

  for (const root of startNodes) {
    visit(root.id, 0, new Set());
    nextLeafSlot += 0.5;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) visit(node.id, 0, new Set());
  }

  return {
    depthById,
    slotById,
    leafCount: Math.max(nextLeafSlot - 0.5, 1),
  };
};

const withDirectionalEdges = (
  edges: WorkspaceLabEdge[],
  sourcePosition: Position,
  targetPosition: Position,
  path: "smoothstep" | "bezier",
): WorkspaceLabEdge[] =>
  edges.map((edge) => ({
    ...edge,
    sourceHandle: getHandleId("source", sourcePosition),
    targetHandle: getHandleId("target", targetPosition),
    data: { ...edge.data, path },
  }));

const calculateVerticalLayout = (
  scenario: WorkspaceLabScenario,
): LayoutResult => {
  const metrics = getTreeMetrics(scenario.nodes, scenario.edges);

  return {
    nodes: scenario.nodes.map((node) => ({
      ...node,
      position: {
        x: (metrics.slotById.get(node.id) ?? 0) * 190,
        y: (metrics.depthById.get(node.id) ?? 0) * 145,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { ...node.data, layoutMode: "vertical" },
    })),
    edges: withDirectionalEdges(
      scenario.edges,
      Position.Bottom,
      Position.Top,
      "smoothstep",
    ),
  };
};

const calculateHorizontalLayout = (
  scenario: WorkspaceLabScenario,
): LayoutResult => {
  const metrics = getTreeMetrics(scenario.nodes, scenario.edges);

  return {
    nodes: scenario.nodes.map((node) => ({
      ...node,
      position: {
        x: (metrics.depthById.get(node.id) ?? 0) * 250,
        y: (metrics.slotById.get(node.id) ?? 0) * 95,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { ...node.data, layoutMode: "horizontal" },
    })),
    edges: withDirectionalEdges(
      scenario.edges,
      Position.Right,
      Position.Left,
      "smoothstep",
    ),
  };
};

const getRadialHandlePosition = (deltaX: number, deltaY: number) => {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX >= 0 ? Position.Right : Position.Left;
  }

  return deltaY >= 0 ? Position.Bottom : Position.Top;
};

const calculateRadialLayout = (
  scenario: WorkspaceLabScenario,
): LayoutResult => {
  const metrics = getTreeMetrics(scenario.nodes, scenario.edges);
  const positions = new Map<string, { x: number; y: number }>();
  const nodeWidth = 170;
  const nodeHeight = 56;

  const nodes = scenario.nodes.map((node) => {
    const depth = metrics.depthById.get(node.id) ?? 0;
    const slot = metrics.slotById.get(node.id) ?? 0;
    const angle = (slot / metrics.leafCount) * Math.PI * 2 - Math.PI / 2;
    const radius = depth * 230;
    const center = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
    const position = {
      x: center.x - nodeWidth / 2,
      y: center.y - nodeHeight / 2,
    };

    positions.set(node.id, center);

    return {
      ...node,
      position,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: { ...node.data, layoutMode: "radial" as const },
    };
  });

  const edges = scenario.edges.map((edge) => {
    const source = positions.get(edge.source) ?? { x: 0, y: 0 };
    const target = positions.get(edge.target) ?? { x: 0, y: 0 };
    const sourcePosition = getRadialHandlePosition(
      target.x - source.x,
      target.y - source.y,
    );
    const targetPosition = oppositePosition[sourcePosition];

    return {
      ...edge,
      sourceHandle: getHandleId("source", sourcePosition),
      targetHandle: getHandleId("target", targetPosition),
      data: { ...edge.data, path: "bezier" as const },
    };
  });

  return { nodes, edges };
};

export const workspaceLabLayouts = [
  {
    id: "vertical",
    name: "세로",
    description: "부모에서 자식으로 위에서 아래로 전개합니다.",
    calculate: calculateVerticalLayout,
  },
  {
    id: "horizontal",
    name: "가로",
    description: "부모에서 자식으로 왼쪽에서 오른쪽으로 전개합니다.",
    calculate: calculateHorizontalLayout,
  },
  {
    id: "radial",
    name: "방사형",
    description: "루트를 중심으로 깊이별 원을 따라 노드를 배치합니다.",
    calculate: calculateRadialLayout,
  },
] as const satisfies readonly WorkspaceLabLayoutDefinition[];

export type WorkspaceLabLayoutId = (typeof workspaceLabLayouts)[number]["id"];

export function getWorkspaceLabLayout(id: WorkspaceLabLayoutId) {
  return (
    workspaceLabLayouts.find((layout) => layout.id === id) ??
    workspaceLabLayouts[0]
  );
}
