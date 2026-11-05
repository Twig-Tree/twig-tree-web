import { Position } from "@xyflow/react";
import type {
  WorkspaceLabEdge,
  WorkspaceLabNode,
  WorkspaceLabScenario,
} from "./types";
import { workspaceLabSmoothStepMinimumGap } from "./edge-routing";

type LayoutResult = {
  nodes: WorkspaceLabNode[];
  edges: WorkspaceLabEdge[];
};

export type WorkspaceLabLayoutNodeSize = {
  width: number;
  height: number;
};

export type WorkspaceLabLayoutNodeSizes = ReadonlyMap<
  string,
  WorkspaceLabLayoutNodeSize
>;

export interface WorkspaceLabLayoutInput {
  scenario: WorkspaceLabScenario;
  spacing: WorkspaceLabLayoutSpacingDefinition;
  fallbackNodeSize: WorkspaceLabLayoutNodeSize;
  nodeSizes?: WorkspaceLabLayoutNodeSizes;
}

export interface WorkspaceLabLayoutDefinition {
  id: string;
  name: string;
  description: string;
  calculate: (input: WorkspaceLabLayoutInput) => LayoutResult;
}

export interface WorkspaceLabLayoutSpacingDefinition {
  id: string;
  name: string;
  description: string;
  vertical: { siblingGap: number; levelGap: number };
  horizontal: { siblingGap: number; levelGap: number };
  radial: { ringGap: number };
  rootGapSlots: number;
}

type TreeMetrics = {
  depthById: Map<string, number>;
  slotById: Map<string, number>;
  leafCount: number;
};

type NodeSizeAxis = keyof WorkspaceLabLayoutNodeSize;

export const workspaceLabLayoutSpacings = [
  {
    id: "tight",
    name: "촘촘하게",
    description: "구조를 빠르게 훑을 수 있도록 단계와 형제 간격을 줄입니다.",
    vertical: { siblingGap: 12, levelGap: 30 },
    horizontal: { siblingGap: 10, levelGap: 50 },
    radial: { ringGap: 40 },
    rootGapSlots: 0.35,
  },
  {
    id: "balanced",
    name: "균형",
    description: "노드 크기와 연결선 가독성의 균형을 맞춘 기본 간격입니다.",
    vertical: { siblingGap: 42, levelGap: 69 },
    horizontal: { siblingGap: 19, levelGap: 102 },
    radial: { ringGap: 82 },
    rootGapSlots: 0.5,
  },
  {
    id: "airy",
    name: "넓게",
    description: "각 가지를 분리해 읽을 수 있도록 충분한 공간을 둡니다.",
    vertical: { siblingGap: 82, levelGap: 110 },
    horizontal: { siblingGap: 55, levelGap: 150 },
    radial: { ringGap: 130 },
    rootGapSlots: 0.75,
  },
] as const satisfies readonly WorkspaceLabLayoutSpacingDefinition[];

export type WorkspaceLabLayoutSpacingId =
  (typeof workspaceLabLayoutSpacings)[number]["id"];

export function getWorkspaceLabLayoutSpacing(
  id: WorkspaceLabLayoutSpacingId,
): WorkspaceLabLayoutSpacingDefinition {
  return (
    workspaceLabLayoutSpacings.find((spacing) => spacing.id === id) ??
    workspaceLabLayoutSpacings[1]
  );
}

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

const getNodeSize = (
  id: string,
  nodeSizes: WorkspaceLabLayoutNodeSizes | undefined,
  fallbackNodeSize: WorkspaceLabLayoutNodeSize,
): WorkspaceLabLayoutNodeSize => {
  const measured = nodeSizes?.get(id);

  return {
    width:
      measured && Number.isFinite(measured.width) && measured.width > 0
        ? measured.width
        : fallbackNodeSize.width,
    height:
      measured && Number.isFinite(measured.height) && measured.height > 0
        ? measured.height
        : fallbackNodeSize.height,
  };
};

/*
리프를 왼쪽부터 슬롯에 놓고, 부모는 자식 슬롯의 평균에 둔다.
세로·가로는 이 슬롯을 축으로 사용하고 방사형은 각도로 변환한다.
*/
const getTreeMetrics = (
  nodes: WorkspaceLabNode[],
  edges: WorkspaceLabEdge[],
  rootGapSlots: number,
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

  for (const [index, root] of startNodes.entries()) {
    if (index > 0) nextLeafSlot += rootGapSlots;
    visit(root.id, 0, new Set());
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) visit(node.id, 0, new Set());
  }

  return {
    depthById,
    slotById,
    leafCount: Math.max(nextLeafSlot, 1),
  };
};

const getDepthOffsets = (
  nodes: WorkspaceLabNode[],
  depthById: Map<string, number>,
  nodeSizes: WorkspaceLabLayoutNodeSizes | undefined,
  fallbackNodeSize: WorkspaceLabLayoutNodeSize,
  primaryAxis: NodeSizeAxis,
  levelGap: number,
) => {
  const maximumSizeByDepth = new Map<number, number>();
  let maximumDepth = 0;

  for (const node of nodes) {
    const depth = depthById.get(node.id) ?? 0;
    const size = getNodeSize(node.id, nodeSizes, fallbackNodeSize)[primaryAxis];

    maximumDepth = Math.max(maximumDepth, depth);
    maximumSizeByDepth.set(
      depth,
      Math.max(maximumSizeByDepth.get(depth) ?? 0, size),
    );
  }

  const offsets = new Map<number, number>([[0, 0]]);

  for (let depth = 1; depth <= maximumDepth; depth += 1) {
    const previousDepth = depth - 1;
    const previousOffset = offsets.get(previousDepth) ?? 0;
    const previousSize =
      maximumSizeByDepth.get(previousDepth) ?? fallbackNodeSize[primaryAxis];

    offsets.set(depth, previousOffset + previousSize + levelGap);
  }

  return offsets;
};

/*
각 노드의 실제 크기로 subtree가 차지할 보조축 길이를 계산한다.
부모는 subtree 중앙에, 자식 subtree는 서로 겹치지 않게 연속 배치한다.
*/
const getTreeSecondaryCenters = (
  nodes: WorkspaceLabNode[],
  edges: WorkspaceLabEdge[],
  nodeSizes: WorkspaceLabLayoutNodeSizes | undefined,
  fallbackNodeSize: WorkspaceLabLayoutNodeSize,
  secondaryAxis: NodeSizeAxis,
  siblingGap: number,
  rootGapSlots: number,
) => {
  const childrenById = getChildrenById(nodes, edges);
  const targetIds = new Set(edges.map((edge) => edge.target));
  const roots = nodes.filter((node) => !targetIds.has(node.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const spanById = new Map<string, number>();

  const getSpan = (id: string, lineage: Set<string>): number => {
    const cached = spanById.get(id);
    if (cached !== undefined) return cached;

    const ownSize = getNodeSize(id, nodeSizes, fallbackNodeSize)[secondaryAxis];
    if (lineage.has(id)) return ownSize;

    const nextLineage = new Set(lineage).add(id);
    const children = (childrenById.get(id) ?? []).filter(
      (childId) => nodeById.has(childId) && !nextLineage.has(childId),
    );
    const childrenSpan = children.reduce(
      (total, childId, index) =>
        total + getSpan(childId, nextLineage) + (index > 0 ? siblingGap : 0),
      0,
    );
    const span = Math.max(ownSize, childrenSpan);

    spanById.set(id, span);
    return span;
  };

  const centers = new Map<string, number>();
  const placed = new Set<string>();

  const place = (id: string, start: number, lineage: Set<string>) => {
    if (placed.has(id)) return;

    placed.add(id);
    const span = getSpan(id, lineage);
    centers.set(id, start + span / 2);

    const nextLineage = new Set(lineage).add(id);
    const children = (childrenById.get(id) ?? []).filter(
      (childId) =>
        nodeById.has(childId) &&
        !nextLineage.has(childId) &&
        !placed.has(childId),
    );
    const childrenSpan = children.reduce(
      (total, childId, index) =>
        total + getSpan(childId, nextLineage) + (index > 0 ? siblingGap : 0),
      0,
    );
    let childStart = start + (span - childrenSpan) / 2;

    for (const childId of children) {
      place(childId, childStart, nextLineage);
      childStart += getSpan(childId, nextLineage) + siblingGap;
    }
  };

  const startNodes = roots.length > 0 ? roots : nodes.slice(0, 1);
  const rootGap =
    siblingGap + fallbackNodeSize[secondaryAxis] * Math.max(rootGapSlots, 0);
  let nextStart = 0;

  for (const root of startNodes) {
    if (placed.has(root.id)) continue;
    place(root.id, nextStart, new Set());
    nextStart += getSpan(root.id, new Set()) + rootGap;
  }

  for (const node of nodes) {
    if (placed.has(node.id)) continue;
    place(node.id, nextStart, new Set());
    nextStart += getSpan(node.id, new Set()) + rootGap;
  }

  return centers;
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

const calculateVerticalLayout = ({
  scenario,
  spacing,
  fallbackNodeSize,
  nodeSizes,
}: WorkspaceLabLayoutInput): LayoutResult => {
  const metrics = getTreeMetrics(
    scenario.nodes,
    scenario.edges,
    spacing.rootGapSlots,
  );
  const levelGap = Math.max(
    spacing.vertical.levelGap,
    workspaceLabSmoothStepMinimumGap,
  );
  const depthOffsets = getDepthOffsets(
    scenario.nodes,
    metrics.depthById,
    nodeSizes,
    fallbackNodeSize,
    "height",
    levelGap,
  );
  const secondaryCenters = getTreeSecondaryCenters(
    scenario.nodes,
    scenario.edges,
    nodeSizes,
    fallbackNodeSize,
    "width",
    spacing.vertical.siblingGap,
    spacing.rootGapSlots,
  );

  return {
    nodes: scenario.nodes.map((node) => {
      const nodeSize = getNodeSize(node.id, nodeSizes, fallbackNodeSize);
      const depth = metrics.depthById.get(node.id) ?? 0;

      return {
        ...node,
        position: {
          x:
            (secondaryCenters.get(node.id) ?? nodeSize.width / 2) -
            nodeSize.width / 2,
          y: depthOffsets.get(depth) ?? 0,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        data: { ...node.data, layoutMode: "vertical" as const },
      };
    }),
    edges: withDirectionalEdges(
      scenario.edges,
      Position.Bottom,
      Position.Top,
      "smoothstep",
    ),
  };
};

const calculateHorizontalLayout = ({
  scenario,
  spacing,
  fallbackNodeSize,
  nodeSizes,
}: WorkspaceLabLayoutInput): LayoutResult => {
  const metrics = getTreeMetrics(
    scenario.nodes,
    scenario.edges,
    spacing.rootGapSlots,
  );
  const levelGap = Math.max(
    spacing.horizontal.levelGap,
    workspaceLabSmoothStepMinimumGap,
  );
  const depthOffsets = getDepthOffsets(
    scenario.nodes,
    metrics.depthById,
    nodeSizes,
    fallbackNodeSize,
    "width",
    levelGap,
  );
  const secondaryCenters = getTreeSecondaryCenters(
    scenario.nodes,
    scenario.edges,
    nodeSizes,
    fallbackNodeSize,
    "height",
    spacing.horizontal.siblingGap,
    spacing.rootGapSlots,
  );

  return {
    nodes: scenario.nodes.map((node) => {
      const nodeSize = getNodeSize(node.id, nodeSizes, fallbackNodeSize);
      const depth = metrics.depthById.get(node.id) ?? 0;

      return {
        ...node,
        position: {
          x: depthOffsets.get(depth) ?? 0,
          y:
            (secondaryCenters.get(node.id) ?? nodeSize.height / 2) -
            nodeSize.height / 2,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { ...node.data, layoutMode: "horizontal" as const },
      };
    }),
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

const calculateRadialLayout = ({
  scenario,
  spacing,
  fallbackNodeSize,
  nodeSizes,
}: WorkspaceLabLayoutInput): LayoutResult => {
  const metrics = getTreeMetrics(
    scenario.nodes,
    scenario.edges,
    spacing.rootGapSlots,
  );
  const positions = new Map<string, { x: number; y: number }>();
  const maximumDiameterByDepth = new Map<number, number>();
  let maximumDepth = 0;

  for (const node of scenario.nodes) {
    const depth = metrics.depthById.get(node.id) ?? 0;
    const size = getNodeSize(node.id, nodeSizes, fallbackNodeSize);
    const diameter = Math.max(size.width, size.height);

    maximumDepth = Math.max(maximumDepth, depth);
    maximumDiameterByDepth.set(
      depth,
      Math.max(maximumDiameterByDepth.get(depth) ?? 0, diameter),
    );
  }

  const radiusByDepth = new Map<number, number>([[0, 0]]);
  for (let depth = 1; depth <= maximumDepth; depth += 1) {
    const previousDepth = depth - 1;
    const previousRadius = radiusByDepth.get(previousDepth) ?? 0;
    const previousDiameter =
      maximumDiameterByDepth.get(previousDepth) ??
      Math.max(fallbackNodeSize.width, fallbackNodeSize.height);
    const diameter =
      maximumDiameterByDepth.get(depth) ??
      Math.max(fallbackNodeSize.width, fallbackNodeSize.height);

    radiusByDepth.set(
      depth,
      previousRadius +
        previousDiameter / 2 +
        spacing.radial.ringGap +
        diameter / 2,
    );
  }

  const nodes = scenario.nodes.map((node) => {
    const depth = metrics.depthById.get(node.id) ?? 0;
    const slot = metrics.slotById.get(node.id) ?? 0;
    const angle = (slot / metrics.leafCount) * Math.PI * 2 - Math.PI / 2;
    const radius = radiusByDepth.get(depth) ?? 0;
    const nodeSize = getNodeSize(node.id, nodeSizes, fallbackNodeSize);
    const center = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
    const position = {
      x: center.x - nodeSize.width / 2,
      y: center.y - nodeSize.height / 2,
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
