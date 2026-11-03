import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

export type NodePlacement = {
  parentClientId: string; // 부모의 편집기 노드 ID
  position: number; // 형제 사이의 순번. 1부터 세며 노드 이동 요청의 position과 같은 기준이다
};

/*
함수 이름 : getNodePlacement
기능 : 노드가 지금 어느 부모 밑 몇 번째에 있는지 구한다. 형제 순서는 화면이 형제를 놓는 기준인 노드 배열 순서로 읽는다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
string clientId -> 위치를 구할 노드의 편집기 노드 ID
반환값 : 부모와 순번. 루트이거나 트리에 없는 노드면 null
*/
export const getNodePlacement = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  clientId: string,
): NodePlacement | null => {
  const parentClientId = edges.find((edge) => edge.target === clientId)?.source;

  if (parentClientId === undefined) return null;

  const siblingClientIds = new Set(
    edges
      .filter((edge) => edge.source === parentClientId)
      .map((edge) => edge.target),
  );
  const siblingIndex = nodes
    .filter((node) => siblingClientIds.has(node.id))
    .findIndex((node) => node.id === clientId);

  if (siblingIndex === -1) return null;

  return { parentClientId, position: siblingIndex + 1 };
};
