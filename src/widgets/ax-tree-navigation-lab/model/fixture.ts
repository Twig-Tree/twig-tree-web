import type { Edge, Node } from "@xyflow/react";
import {
  projectTopologyPoint,
  type TopologyPoint,
  type TopologyProjection,
} from "./topology";

export const PROTOTYPE_NODE_WIDTH = 168;
export const PROTOTYPE_NODE_HEIGHT = 60;
export const PROTOTYPE_SIBLING_GAP = 32;
export const PROTOTYPE_LAYER_GAP = 64;

export type PrototypeNodeKind = "root" | "branch" | "leaf";

export type PrototypeNodeData = {
  label: string;
  kind: PrototypeNodeKind;
  parentId: string | null;
  branchId: string | null;
  topology: TopologyPoint;
  isDimmed?: boolean;
  isPath?: boolean;
};

export type PrototypeNode = Node<PrototypeNodeData, "prototype">;
export type PrototypeEdge = Edge<Record<string, never>, "smoothstep"> & {
  pathOptions: { borderRadius: number; offset: number };
};

type BranchFixture = {
  id: string;
  label: string;
  children: string[];
};

const branches: BranchFixture[] = [
  { id: "research", label: "사용자 리서치", children: [] },
  {
    id: "problem",
    label: "문제 정의",
    children: ["관찰된 현상", "사용자 맥락", "성공 조건"],
  },
  { id: "journey", label: "사용자 여정", children: [] },
  { id: "structure", label: "정보 구조", children: [] },
  {
    id: "interaction",
    label: "상호작용 설계",
    children: ["조망 상태", "읽기 상태", "상태 전환"],
  },
  { id: "visual", label: "비주얼 시스템", children: [] },
  { id: "content", label: "콘텐츠 전략", children: [] },
  {
    id: "accessibility",
    label: "접근성 검토",
    children: ["키보드 탐색", "화면 확대"],
  },
  { id: "prototype", label: "프로토타입", children: [] },
  { id: "validation", label: "사용성 검증", children: [] },
  { id: "delivery", label: "개발 전달", children: [] },
  { id: "feedback", label: "피드백 반영", children: [] },
];

const rootId = "product-design";
const interactionDepthLabels = [
  "카메라 정책",
  "읽기 창 계산",
  "포커스 복원",
  "피드백 수집",
];

export const PROTOTYPE_TOPOLOGY_PROJECTION: TopologyProjection = {
  origin: { x: 0, y: 0 },
  depth: {
    screenAxis: "x",
    direction: 1,
    step: PROTOTYPE_NODE_WIDTH + PROTOTYPE_LAYER_GAP,
  },
  breadth: {
    screenAxis: "y",
    direction: 1,
    step: PROTOTYPE_NODE_HEIGHT + PROTOTYPE_SIBLING_GAP,
  },
};

const createPosition = (topology: TopologyPoint) =>
  projectTopologyPoint(topology, PROTOTYPE_TOPOLOGY_PROJECTION);

const createFixture = (): {
  nodes: PrototypeNode[];
  edges: PrototypeEdge[];
} => {
  const nodes: PrototypeNode[] = [
    {
      id: rootId,
      type: "prototype",
      position: createPosition({ depth: 0, breadth: 0 }),
      width: PROTOTYPE_NODE_WIDTH,
      height: PROTOTYPE_NODE_HEIGHT,
      data: {
        label: "제품 디자인",
        kind: "root",
        parentId: null,
        branchId: null,
        topology: { depth: 0, breadth: 0 },
      },
    },
  ];
  const edges: PrototypeEdge[] = [];
  let nextBreadthSlot = 0;

  branches.forEach((branch) => {
    const branchTopology = { depth: 1, breadth: nextBreadthSlot };

    nodes.push({
      id: branch.id,
      type: "prototype",
      position: createPosition(branchTopology),
      width: PROTOTYPE_NODE_WIDTH,
      height: PROTOTYPE_NODE_HEIGHT,
      data: {
        label: branch.label,
        kind: "branch",
        parentId: rootId,
        branchId: branch.id,
        topology: branchTopology,
      },
    });
    edges.push({
      id: `${rootId}-${branch.id}`,
      source: rootId,
      target: branch.id,
      type: "smoothstep",
      pathOptions: { borderRadius: 16, offset: 20 },
    });

    branch.children.forEach((label, index) => {
      const childId = `${branch.id}-${index + 1}`;
      const childTopology = {
        depth: 2,
        breadth: nextBreadthSlot + index,
      };

      nodes.push({
        id: childId,
        type: "prototype",
        position: createPosition(childTopology),
        width: PROTOTYPE_NODE_WIDTH,
        height: PROTOTYPE_NODE_HEIGHT,
        data: {
          label,
          kind: branch.id === "interaction" && index === 0 ? "branch" : "leaf",
          parentId: branch.id,
          branchId: branch.id,
          topology: childTopology,
        },
      });
      edges.push({
        id: `${branch.id}-${childId}`,
        source: branch.id,
        target: childId,
        type: "smoothstep",
        pathOptions: { borderRadius: 16, offset: 20 },
      });
    });

    /*
    읽기 창에서 가로 깊이 한계를 실제로 확인할 수 있도록 상호작용 설계의 첫 자식 뒤에 깊은 경로를 둔다.
    세로 밀도와 가로 깊이를 같은 fixture에서 비교하기 위한 프로토타입 전용 데이터다.
    */
    if (branch.id === "interaction") {
      let parentId = "interaction-1";

      interactionDepthLabels.forEach((label, index) => {
        const nodeId = `interaction-depth-${index + 1}`;
        const nodeTopology = {
          depth: index + 3,
          breadth: nextBreadthSlot,
        };

        nodes.push({
          id: nodeId,
          type: "prototype",
          position: createPosition(nodeTopology),
          width: PROTOTYPE_NODE_WIDTH,
          height: PROTOTYPE_NODE_HEIGHT,
          data: {
            label,
            kind:
              index === interactionDepthLabels.length - 1 ? "leaf" : "branch",
            parentId,
            branchId: branch.id,
            topology: nodeTopology,
          },
        });
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "smoothstep",
          pathOptions: { borderRadius: 16, offset: 20 },
        });
        parentId = nodeId;
      });
    }

    nextBreadthSlot += Math.max(1, branch.children.length);
  });

  return { nodes, edges };
};

export const prototypeFixture = createFixture();
export const prototypeBranchIds = branches.map(({ id }) => id);

export const getPrototypeBranchLabel = (branchId: string) =>
  branches.find(({ id }) => id === branchId)?.label ?? branchId;

export const getPrototypeFocusNodeIds = (branchId: string) =>
  prototypeFixture.nodes
    .filter((node) => node.id === branchId || node.data.branchId === branchId)
    .map(({ id }) => id);
