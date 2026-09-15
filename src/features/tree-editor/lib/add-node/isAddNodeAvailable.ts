type IsAddNodeAvailableParams = {
  treeId: string | null; // 편집 중인 트리 ID. 트리가 없는 워크스페이스는 null
  nodeCount: number; // editor store의 노드 개수
  hasSelectedNode: boolean; // 자식 노드를 추가할 기준 노드를 선택했는지 여부
};

/*
함수 이름 : isAddNodeAvailable
기능 : 노드 추가 버튼을 누를 수 있는지 판단한다.
인자 : IsAddNodeAvailableParams
반환값 : 노드가 없으면 루트를 추가할 트리가 있을 때, 노드가 있으면 기준 노드를 선택했을 때 true

노드가 없으면 선택할 노드도 없으므로 선택 여부를 보지 않는다. 트리당 루트는 하나라 노드가 있으면 루트를 추가할 수 없다.
트리가 없는 워크스페이스는 트리를 먼저 만들어야 하므로 아직 막는다.
*/
export const isAddNodeAvailable = ({
  treeId,
  nodeCount,
  hasSelectedNode,
}: IsAddNodeAvailableParams): boolean => {
  if (nodeCount === 0) return treeId !== null;

  return hasSelectedNode;
};
