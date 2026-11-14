import { type CustomEditorEdge } from "../../model/types";

/*
함수 이름 : getLectureGrowStages
기능 : grow 동작이 차례로 드러낼 자손을 대상 노드에서 떨어진 깊이별로 묶는다.
접혀서 화면에 없는 노드는 드러낼 수 없으므로 빼고, 그 아래로도 내려가지 않는다.
대상이 여럿이면 깊이가 같은 자손끼리 함께 묶는다. 대상끼리 조상·자손 사이면 자손 쪽 대상은 숨기지 않는다.
인자 : string[] rootClientIds -> 자라기 시작할 노드
CustomEditorEdge[] edges -> 트리의 엣지 목록. source가 부모, target이 자식이다
ReadonlySet<string> hiddenClientIds -> 접혀서 화면에 없는 노드
반환값 : 깊이 1부터의 자손 clientId 묶음. 자손이 없으면 빈 목록
*/
export const getLectureGrowStages = (
  rootClientIds: string[],
  edges: CustomEditorEdge[],
  hiddenClientIds: ReadonlySet<string>,
): string[][] => {
  const childIdsByParent = new Map<string, string[]>();

  edges.forEach((edge) => {
    const childIds = childIdsByParent.get(edge.source) ?? [];
    childIds.push(edge.target);
    childIdsByParent.set(edge.source, childIds);
  });

  const visitedClientIds = new Set(rootClientIds);
  const stages: string[][] = [];
  let currentClientIds = rootClientIds.filter(
    (clientId) => !hiddenClientIds.has(clientId),
  );

  while (currentClientIds.length > 0) {
    const nextClientIds = currentClientIds.flatMap((clientId) =>
      (childIdsByParent.get(clientId) ?? []).filter((childId) => {
        if (visitedClientIds.has(childId) || hiddenClientIds.has(childId)) {
          return false;
        }

        visitedClientIds.add(childId);
        return true;
      }),
    );

    if (nextClientIds.length > 0) stages.push(nextClientIds);
    currentClientIds = nextClientIds;
  }

  return stages;
};
