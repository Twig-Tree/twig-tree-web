type IsAddNodeAvailableParams = {
  nodeCount: number; // editor store의 노드 개수
  hasSelectedNode: boolean; // 자식 노드를 추가할 기준 노드를 선택했는지 여부
};

/*
함수 이름 : isAddNodeAvailable
기능 : 노드 추가 버튼을 누를 수 있는지 판단한다.
인자 : IsAddNodeAvailableParams
반환값 : 노드가 없으면 항상 true, 노드가 있으면 기준 노드를 선택했을 때 true

노드가 없으면 선택할 노드도 없으므로 선택 여부를 보지 않고 루트 추가를 연다. 트리가 없으면 루트 추가가 트리부터 만든다.
트리당 루트는 하나라 노드가 있으면 루트를 추가할 수 없다.
*/
export const isAddNodeAvailable = ({
  nodeCount,
  hasSelectedNode,
}: IsAddNodeAvailableParams): boolean => {
  if (nodeCount === 0) return true;

  return hasSelectedNode;
};
