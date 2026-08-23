import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";

/*
함수 이름 : getNextOrderIndex
기능 : 부모 노드의 기존 자식 노드 목록을 기준으로 다음 orderIndex를 계산한다.
인자 : string parentClientId -> 기준 부모 노드의 편집기 노드 ID
CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 다음 자식 노드에 사용할 orderIndex
*/
export const getNextOrderIndex = (
  parentClientId: string,
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): number => {
  const childNodeIds = edges
    .filter((edge) => edge.source === parentClientId)
    .map((edge) => edge.target);

  const maxOrderIndex = nodes
    .filter((node) => childNodeIds.includes(node.id))
    .reduce((max, node) => Math.max(max, node.data.orderIndex ?? 0), 0);

  return maxOrderIndex + 1;
};
