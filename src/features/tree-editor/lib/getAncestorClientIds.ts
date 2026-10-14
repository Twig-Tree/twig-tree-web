import { CustomEditorEdge } from "../model/types";

/*
함수 이름 : getAncestorClientIds
기능 : 엣지를 따라 대상 노드의 부모부터 루트까지 조상의 편집기 노드 ID를 모은다. 편집기 노드에는 부모 정보가 없고
엣지의 source가 부모, target이 자식이므로 엣지로 거슬러 올라간다.
인자 : CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
string clientId -> 조상을 구할 노드의 편집기 노드 ID
반환값 : 부모부터 루트 순서의 조상 편집기 노드 ID 목록. 루트이거나 트리에 없는 노드면 빈 배열
*/
export const getAncestorClientIds = (
  edges: CustomEditorEdge[],
  clientId: string,
): string[] => {
  const parentClientIdByChild = new Map(
    edges.map((edge) => [edge.target, edge.source]),
  );

  const ancestorClientIds: string[] = [];
  const visitedClientIds = new Set([clientId]);
  let parentClientId = parentClientIdByChild.get(clientId);

  /*
  트리는 순환이 없다는 전제지만, 엣지가 어긋나 순환이 생겨도 무한 반복하지 않도록 이미 지난 노드를 만나면 멈춘다.
  */
  while (
    parentClientId !== undefined &&
    !visitedClientIds.has(parentClientId)
  ) {
    ancestorClientIds.push(parentClientId);
    visitedClientIds.add(parentClientId);
    parentClientId = parentClientIdByChild.get(parentClientId);
  }

  return ancestorClientIds;
};
