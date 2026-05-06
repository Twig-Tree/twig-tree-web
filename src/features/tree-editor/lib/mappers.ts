import { TreeNode } from "@/src/entities/tree/model/types";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";

export const mapToVisualNodes = (nodes: TreeNode[]): CustomEditorNode[] => {
  return nodes.map((node) => ({
    id: node.id,
    type: "custom",
    data: node.data,
    position: { x: 0, y: 0 }, // 초기 위치는 ELK 레이아웃 엔진 등이 계산하도록 위임
  }));
};

export const mapToVisualEdges = (nodes: TreeNode[]): CustomEditorEdge[] => {
  return nodes
    .filter((node) => node.parentId !== null) // 루트 노드는 들어오는 엣지가 없으므로 제외
    .map((node) => ({
      id: `e-${node.parentId}-${node.id}`, // 엣지 ID는 고유해야 합니다.
      source: node.parentId!, // 부모가 source가 됩니다.
      target: node.id, // 현재 노드가 target이 됩니다.
      type: "smoothstep", // 트리 구조에 어울리는 선 스타일 (선택 사항)
    }));
};

// 노드와 엣지를 한꺼번에 변환해주는 통합 함수
export const transformToFlowElements = (nodes: TreeNode[]) => {
  return {
    nodes: mapToVisualNodes(nodes),
    edges: mapToVisualEdges(nodes),
  };
};
