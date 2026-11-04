import { CustomEditorEdge } from "../model/types";

/*
함수 이름 : getSubtreeClientIds
기능 : 엣지를 따라 대상 노드와 그 하위 노드의 편집기 노드 ID를 모은다. 엣지의 source가 부모, target이 자식이다.
인자 : CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
string clientId -> 하위 트리 루트의 편집기 노드 ID
반환값 : 대상 노드부터 부모 → 자식 순서로 모은 편집기 노드 ID 목록
*/
export const getSubtreeClientIds = (
  edges: CustomEditorEdge[],
  clientId: string,
): string[] => {
  const subtreeClientIds = new Set<string>([clientId]);
  const queue = [clientId];

  while (queue.length > 0) {
    const currentClientId = queue.shift()!;

    edges.forEach((edge) => {
      if (
        edge.source === currentClientId &&
        !subtreeClientIds.has(edge.target)
      ) {
        subtreeClientIds.add(edge.target);
        queue.push(edge.target);
      }
    });
  }

  return Array.from(subtreeClientIds);
};
