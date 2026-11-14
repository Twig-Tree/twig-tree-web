import { type CustomEditorEdge } from "../../model/types";

/*
함수 이름 : getLectureGrowStages
기능 : grow 동작이 차례로 드러낼 자손을 대상 노드에서 떨어진 깊이별로 묶는다.
현재 접혀 있는 자손도 포함한다. 같은 병렬 그룹의 focus가 접힘을 풀면 새로 그려지는 노드도 처음부터 grow 숨김 상태를 따라야 하기 때문이다.
대상이 여럿이면 깊이가 같은 자손끼리 함께 묶는다. 대상끼리 조상·자손 사이면 자손 쪽 대상은 숨기지 않는다.
인자 : string[] rootClientIds -> 자라기 시작할 노드
CustomEditorEdge[] edges -> 트리의 엣지 목록. source가 부모, target이 자식이다
반환값 : 깊이 1부터의 자손 clientId 묶음. 자손이 없으면 빈 목록
*/
export const getLectureGrowStages = (
  rootClientIds: string[],
  edges: CustomEditorEdge[],
): string[][] => {
  const childIdsByParent = new Map<string, string[]>();

  edges.forEach((edge) => {
    const childIds = childIdsByParent.get(edge.source) ?? [];
    childIds.push(edge.target);
    childIdsByParent.set(edge.source, childIds);
  });

  const visitedClientIds = new Set(rootClientIds);
  const stages: string[][] = [];
  let currentClientIds = rootClientIds;

  while (currentClientIds.length > 0) {
    const nextClientIds = currentClientIds.flatMap((clientId) =>
      (childIdsByParent.get(clientId) ?? []).filter((childId) => {
        if (visitedClientIds.has(childId)) return false;

        visitedClientIds.add(childId);
        return true;
      }),
    );

    if (nextClientIds.length > 0) stages.push(nextClientIds);
    currentClientIds = nextClientIds;
  }

  return stages;
};
