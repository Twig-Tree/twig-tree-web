import { MarkerType, Position } from "@xyflow/react";
import type {
  WorkspaceLabEdge,
  WorkspaceLabNode,
  WorkspaceLabScenario,
} from "./types";

const node = (
  id: string,
  label: string,
  x: number,
  y: number,
  options: Partial<WorkspaceLabNode["data"]> = {},
): WorkspaceLabNode => ({
  id,
  type: "workspaceLab",
  position: { x, y },
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
  data: { label, ...options },
});

const edge = (source: string, target: string): WorkspaceLabEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  type: "workspaceLab",
  markerEnd: { type: MarkerType.ArrowClosed },
  data: {},
});

const balancedNodes = [
  node("root", "디지털 제품 디자인", 330, 20, {
    description: "Workspace root",
    isRoot: true,
    hasChildren: true,
  }),
  node("research", "사용자 리서치", 80, 170, { hasChildren: true }),
  node("structure", "정보 구조", 330, 170, { hasChildren: true }),
  node("visual", "비주얼 시스템", 580, 170, { hasChildren: true }),
  node("interview", "인터뷰", 0, 320),
  node("journey", "사용자 여정", 160, 320),
  node("navigation", "내비게이션", 300, 320),
  node("content", "콘텐츠 계층", 440, 320),
  node("color", "컬러와 대비", 560, 320),
  node("type", "타이포그래피", 700, 320),
];

const balancedEdges = [
  edge("root", "research"),
  edge("root", "structure"),
  edge("root", "visual"),
  edge("research", "interview"),
  edge("research", "journey"),
  edge("structure", "navigation"),
  edge("structure", "content"),
  edge("visual", "color"),
  edge("visual", "type"),
];

const deepNodes = [
  node("root", "서비스 전략", 300, 0, {
    isRoot: true,
    hasChildren: true,
  }),
  node("principle", "제품 원칙", 300, 120, { hasChildren: true }),
  node("experience", "핵심 경험", 300, 240, { hasChildren: true }),
  node("flow", "작업 흐름", 300, 360, { hasChildren: true }),
  node("detail", "세부 인터랙션과 예외 상태", 300, 480, {
    description: "Long label stress test",
  }),
];

const deepEdges = [
  edge("root", "principle"),
  edge("principle", "experience"),
  edge("experience", "flow"),
  edge("flow", "detail"),
];

const denseNodes = [
  node("root", "디자인 시스템", 350, 0, {
    isRoot: true,
    hasChildren: true,
  }),
  ...Array.from({ length: 10 }, (_, index) =>
    node(
      `dense-${index}`,
      [
        "Foundations",
        "Color",
        "Typography",
        "Spacing",
        "Elevation",
        "Buttons",
        "Inputs",
        "Navigation",
        "Feedback",
        "Patterns",
      ][index],
      (index % 5) * 170,
      index < 5 ? 150 : 300,
      { hasChildren: false },
    ),
  ),
];

const denseEdges = denseNodes.slice(1).map((item) => edge("root", item.id));

export const workspaceLabScenarios: WorkspaceLabScenario[] = [
  {
    id: "balanced",
    label: "균형 잡힌 트리",
    description: "일반적인 깊이와 형제 수를 가진 기본 디자인 검토용 트리",
    nodes: balancedNodes,
    edges: balancedEdges,
  },
  {
    id: "deep",
    label: "깊은 트리",
    description: "세로 흐름과 긴 제목이 노드 크기에 미치는 영향을 확인",
    nodes: deepNodes,
    edges: deepEdges,
  },
  {
    id: "dense",
    label: "밀집된 트리",
    description: "형제가 많은 상태에서 간격과 연결선의 가독성을 확인",
    nodes: denseNodes,
    edges: denseEdges,
  },
  {
    id: "empty",
    label: "빈 워크스페이스",
    description: "첫 노드를 만들기 전의 캔버스와 빈 상태를 확인",
    nodes: [],
    edges: [],
  },
];
