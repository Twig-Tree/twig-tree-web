import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getSubtreeClientIds } from "../getSubtreeClientIds";

type SubtreeCreationStep = {
  node: CustomEditorNode; // 다시 만들 노드
  parentClientId: string; // 부모의 편집기 노드 ID. 하위 트리 루트면 원래 부모다
};

/*
함수 이름 : getSubtreeCreationOrder
기능 : 지운 하위 트리를 다시 만들 순서를 구한다. 자식을 만들려면 부모의 서버 ID가 있어야 하므로 부모가 항상 자식보다 앞선다.
인자 : CustomEditorNode[] subtreeNodes -> 지운 노드 목록
CustomEditorEdge[] subtreeEdges -> 지운 엣지 목록. 하위 트리 루트로 들어오던 엣지를 포함한다
string rootClientId -> 하위 트리 루트의 편집기 노드 ID
반환값 : 루트부터 부모 → 자식 순서로 놓인 생성 단계 목록
*/
export const getSubtreeCreationOrder = (
  subtreeNodes: CustomEditorNode[],
  subtreeEdges: CustomEditorEdge[],
  rootClientId: string,
): SubtreeCreationStep[] => {
  const nodeById = new Map(subtreeNodes.map((node) => [node.id, node]));
  const parentClientIdByChild = new Map(
    subtreeEdges.map((edge) => [edge.target, edge.source]),
  );

  return getSubtreeClientIds(subtreeEdges, rootClientId).flatMap((clientId) => {
    const node = nodeById.get(clientId);
    const parentClientId = parentClientIdByChild.get(clientId);

    return node && parentClientId !== undefined
      ? [{ node, parentClientId }]
      : [];
  });
};
