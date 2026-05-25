import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";

export const isDuplicateEdge = (
  edges: CustomEditorEdge[],
  source: string,
  target: string,
  excludeId?: string,
) => {
  return edges.some(
    (edge) =>
      edge.id !== excludeId && edge.source === source && edge.target === target,
  );
};

/**
 * 목적지(target) 노드에 이미 부모 노드가 연결되어 있는지 확인하는 함수
 */
export const hasAlreadyParent = (
  edges: CustomEditorEdge[],
  targetId: string,
): boolean => {
  // 새 화살표가 가리키려는 곳(targetId)을 이미 목적지로 삼고 있는 엣지가 있는지 검사
  return edges.some((edge) => edge.target === targetId);
};
