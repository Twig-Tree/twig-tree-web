import { useEffect } from "react";
import { TreeNode } from "@/src/entities/tree";
import { transformToFlowElements } from "../../lib/mappers";
import { useCollapseStore } from "../collapse/collapseStore";
import { useTreeStore } from "../treeStore";

type UseInitializeTreeParams = {
  treeId: string | null; // 편집할 트리 ID. 트리가 없는 워크스페이스는 null
  treeData: TreeNode[] | undefined; // 트리 조회 캐시의 노드 목록
  clear: () => void; // 초기화 직후 undo/redo history를 비우는 함수
};

/*
함수 이름 : useInitializeTree
기능 : 트리 조회 캐시의 노드 목록을 editor store의 초기 상태로 반영하면서 저장된 접힘 상태를 복원하고, 편집기를 벗어날 때 두 store를 비운다.
인자 : UseInitializeTreeParams
반환값 : 없음
*/
export const useInitializeTree = ({
  treeId,
  treeData,
  clear,
}: UseInitializeTreeParams) => {
  const initializeTree = useTreeStore((state) => state.initializeTree);
  const resetTree = useTreeStore((state) => state.resetTree);
  const currentTreeId = useTreeStore((state) => state.treeId);
  const restoreCollapse = useCollapseStore((state) => state.restoreCollapse);
  const resetCollapse = useCollapseStore((state) => state.resetCollapse);

  /*
  초기화는 트리당 한 번만 수행한다. 재초기화는 모든 노드의 position을 원점으로 되돌리고
  편집 중인 내용까지 덮어쓰므로, 이미 이 트리로 초기화되어 있으면 캐시가 갱신되어도 건너뛴다.
  */
  useEffect(() => {
    /*
    트리가 없으면 채울 노드도 없다. store는 처음부터 비어 있으므로 그대로 둔다.
    */
    if (treeId === null || !treeData) return;

    if (currentTreeId === treeId) return;

    const { nodes, edges } = transformToFlowElements(treeData);

    initializeTree({
      treeId,
      nodes,
      edges,
    });

    /*
    노드와 접힘 상태를 같은 effect에서 채워 한 번에 렌더되게 한다. 그래야 첫 레이아웃 계산부터
    접힌 노드의 하위 노드를 뺀 모양으로 돈다. 위 가드를 함께 따르므로 복원도 트리당 한 번만 일어난다.
    */
    restoreCollapse({ treeId, nodes, edges });

    clear();
  }, [treeId, treeData, currentTreeId, initializeTree, restoreCollapse, clear]);

  /*
  편집기를 벗어나면 store를 비운다. 위 가드가 store가 남아 있는 한 재초기화를 막으므로,
  비우지 않으면 재진입했을 때 이전 store 상태가 그대로 그려지고 그 사이의 서버 변경이 반영되지 않는다.
  접힘 store는 treeStore와 함께 채워지므로 비울 때도 함께 비워 두 store의 생명주기를 맞춘다.
  */
  useEffect(
    () => () => {
      resetTree();
      resetCollapse();
    },
    [resetTree, resetCollapse],
  );
};
