import { useCallback } from "react";
import { TreeNode } from "@/src/entities/tree";
import { getReconciledFlowElements } from "../../lib/sync/getReconciledFlowElements";
import { useEditHistoryStore } from "../history/editHistoryStore";
import { useTreeStore } from "../treeStore";

type UseApplyServerTreeParams = {
  onSelectedNodeRemoved: () => void; // 선택했던 노드가 서버에서 사라졌을 때 페이지가 할 일. 메모 패널 닫기 등
};

/*
함수 이름 : useApplyServerTree
기능 : 다른 곳의 변경이 담긴 서버 노드 목록을 열려 있는 편집기의 store에 반영하는 함수를 만든다. 지금 화면의 노드 신원과 좌표·선택은 유지하고, 선택했던 노드가 사라졌으면 onSelectedNodeRemoved를 부른다.
인자 : UseApplyServerTreeParams
반환값 : 서버 노드 목록을 받아 store에 반영하는 함수

undo 기록은 비운다. 기록의 대상이나 되돌릴 자리가 다른 곳의 변경으로 사라졌을 수 있다.
접힘과 강조는 그대로 둔다. 접힘을 다시 복원하면 새 집합이 만들어져 useNodeTransition이 접힘 변경으로 오인하고,
강조를 비우면 검색어가 남아 있는데 강조만 사라진다. 결과 목록은 store에서 파생되므로 새 노드에 맞춰 다시 계산된다.
*/
export const useApplyServerTree = ({
  onSelectedNodeRemoved,
}: UseApplyServerTreeParams) => {
  const applyServerTreeInStore = useTreeStore(
    (state) => state.applyServerTreeInStore,
  );
  const clearEditHistory = useEditHistoryStore((state) => state.clear);

  return useCallback(
    (serverNodes: TreeNode[]) => {
      const { nodes: currentNodes, edges: currentEdges } =
        useTreeStore.getState();
      const selectedClientId = currentNodes.find((node) => node.selected)?.id;
      const { nodes, edges } = getReconciledFlowElements({
        serverNodes,
        currentNodes,
        currentEdges,
      });

      applyServerTreeInStore({ nodes, edges });
      clearEditHistory();

      if (
        selectedClientId !== undefined &&
        !nodes.some((node) => node.id === selectedClientId)
      ) {
        onSelectedNodeRemoved();
      }
    },
    [applyServerTreeInStore, clearEditHistory, onSelectedNodeRemoved],
  );
};
