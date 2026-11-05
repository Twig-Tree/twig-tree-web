import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

export type MoveNodeParams = {
  clientId: string; // 옮길 노드의 편집기 노드 ID
  parentClientId: string; // 목적지 부모의 편집기 노드 ID. 같은 부모 안에서 순서만 바꿀 때도 현재 부모를 넘긴다
  position: number; // 옮길 노드를 뺀 목적지 형제 사이의 순번. 1부터 세며 서버 요청의 position과 같다
};

/*
함수 이름 : getMovedElements
기능 : 노드를 하위 트리째 목적지 부모 밑의 position 번째로 옮긴 노드·엣지 배열을 만든다.
서버와 같은 규칙으로 목적지 형제의 orderIndex를 1..n으로 다시 매기고, 다른 부모로 옮기면 원래 형제도 다시 매긴다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
MoveNodeParams params -> 옮길 노드와 목적지
반환값 : 이동을 반영한 노드·엣지 배열. 옮길 노드가 없거나 루트면 입력을 그대로 돌려준다
*/
export const getMovedElements = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  { clientId, parentClientId, position }: MoveNodeParams,
): { nodes: CustomEditorNode[]; edges: CustomEditorEdge[] } => {
  const movedNode = nodes.find((node) => node.id === clientId);
  const previousParentClientId = edges.find(
    (edge) => edge.target === clientId,
  )?.source;

  if (!movedNode || previousParentClientId === undefined) {
    return { nodes, edges };
  }

  const isSameParent = previousParentClientId === parentClientId;

  /*
  부모를 바꿀 때는 들어오는 엣지의 source만 바꾼다. 엣지 ID와 하위 트리의 엣지는 그대로 두므로 하위 노드는 따라 옮겨진다.
  */
  const nextEdges = isSameParent
    ? edges
    : edges.map((edge) =>
        edge.target === clientId ? { ...edge, source: parentClientId } : edge,
      );

  const nodesWithoutMoved = nodes.filter((node) => node.id !== clientId);

  /*
  형제 순서는 노드 배열 순서로 읽는다. 화면이 이 순서로 형제를 놓으므로(sortEdgesByTargetOrder)
  사용자가 보고 고른 position과 같은 기준이다.
  */
  const getSiblingsWithoutMoved = (siblingParentClientId: string) => {
    const childClientIds = new Set(
      edges
        .filter((edge) => edge.source === siblingParentClientId)
        .map((edge) => edge.target),
    );

    return nodesWithoutMoved.filter((node) => childClientIds.has(node.id));
  };

  const targetSiblings = getSiblingsWithoutMoved(parentClientId);

  /*
  position 번째 형제 바로 앞에 끼운다. 맨 끝이면 마지막 형제 바로 뒤, 형제가 없으면 배열 끝에 둔다.
  형제 사이의 상대 순서만 화면에 드러나므로 다른 노드와의 위치는 상관없다.
  */
  const anchorNode = targetSiblings[position - 1];
  const lastSibling = targetSiblings.at(-1);
  const insertIndex = anchorNode
    ? nodesWithoutMoved.indexOf(anchorNode)
    : lastSibling
      ? nodesWithoutMoved.indexOf(lastSibling) + 1
      : nodesWithoutMoved.length;

  const reorderedNodes = [
    ...nodesWithoutMoved.slice(0, insertIndex),
    movedNode,
    ...nodesWithoutMoved.slice(insertIndex),
  ];

  const nextTargetSiblings = [...targetSiblings];
  nextTargetSiblings.splice(position - 1, 0, movedNode);

  const nextOrderIndexByClientId = new Map(
    nextTargetSiblings.map((node, index) => [node.id, index + 1]),
  );

  if (!isSameParent) {
    getSiblingsWithoutMoved(previousParentClientId).forEach((node, index) =>
      nextOrderIndexByClientId.set(node.id, index + 1),
    );
  }

  /*
  orderIndex가 그대로인 노드는 객체를 재사용해 다시 그려지지 않게 한다.
  */
  const nextNodes = reorderedNodes.map((node) => {
    const nextOrderIndex = nextOrderIndexByClientId.get(node.id);

    return nextOrderIndex === undefined ||
      nextOrderIndex === node.data.orderIndex
      ? node
      : { ...node, data: { ...node.data, orderIndex: nextOrderIndex } };
  });

  return { nodes: nextNodes, edges: nextEdges };
};
