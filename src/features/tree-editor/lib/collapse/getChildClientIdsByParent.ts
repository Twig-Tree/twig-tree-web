import { CustomEditorEdge } from "../../model/types";

/*
함수 이름 : getChildClientIdsByParent
기능 : 엣지 목록에서 부모 노드마다 자식 노드의 편집기 노드 ID 목록을 모은다. 편집기 노드에는 부모 정보가 없고 엣지의 source가 부모, target이 자식이므로 하위 노드를 따라갈 때 이 표를 쓴다.
인자 : CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
반환값 : 부모 노드의 편집기 노드 ID를 자식 노드의 편집기 노드 ID 목록으로 바꾸는 표
*/
export const getChildClientIdsByParent = (
  edges: CustomEditorEdge[],
): Map<string, string[]> => {
  const childClientIdsByParent = new Map<string, string[]>();

  edges.forEach((edge) => {
    const childClientIds = childClientIdsByParent.get(edge.source) ?? [];
    childClientIds.push(edge.target);
    childClientIdsByParent.set(edge.source, childClientIds);
  });

  return childClientIdsByParent;
};
