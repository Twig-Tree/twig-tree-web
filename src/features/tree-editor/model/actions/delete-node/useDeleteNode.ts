import { useDeleteNodeMutation } from "@/src/entities/tree/model/mutations/useDeleteNodeMutation";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";
import { getSubtreeClientIds } from "../../../lib/getSubtreeClientIds";
import { useEditHistoryStore } from "../../history/editHistoryStore";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

interface UseDeleteNodeParams {
  treeId: string | null; // 노드를 삭제할 트리 ID. 트리가 없는 워크스페이스는 null
  selectedNode: CustomEditorNode | undefined; // 삭제 기준이 되는 선택 노드
}

/*
함수 이름 : useDeleteNode
기능 : 선택된 노드를 루트로 하는 서브트리를 optimistic update로 editor store에서 삭제하고, 서버 요청 실패 시 삭제 전 구조로 rollback한다.
인자 : UseDeleteNodeParams
반환값 : 노드 삭제 핸들러와 노드 삭제 mutation 상태
*/
export const useDeleteNode = ({
  treeId,
  selectedNode,
}: UseDeleteNodeParams) => {
  const deleteNodeFromStore = useTreeStore(
    (state) => state.deleteNodeFromStore,
  );
  const restoreStructureInStore = useTreeStore(
    (state) => state.restoreStructureInStore,
  );
  const clearEditHistory = useEditHistoryStore((state) => state.clear);
  const {
    mutate: deleteNodeOnServer,
    isPending: isDeletingNode,
    isError: isDeleteNodeError,
  } = useDeleteNodeMutation();

  /*
  선택된 노드를 기준으로 삭제할 서브트리를 찾고 서버에 노드 삭제 요청을 보낸다.
  */
  const handleDeleteNode = () => {
    /*
    트리가 없으면 노드도 없어 선택된 노드가 있을 수 없지만, 요청에 treeId가 필요하므로 타입을 좁힌다.
    */
    if (treeId === null || !selectedNode || isDeletingNode) return;

    const serverId = selectedNode.data.serverId; // 서버 요청에 사용할 삭제 대상 노드의 서버 ID

    if (serverId === null) {
      alert("아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const { nodes, edges } = useTreeStore.getState(); // 실패하면 이 삭제 전 구조로 되돌린다.

    const hasParent = edges.some((edge) => edge.target === selectedNode.id); // 부모 엣지가 없으면 루트 노드로 판단한다.

    if (!hasParent) {
      alert("루트 노드는 삭제할 수 없습니다.");
      return;
    }

    /*
    서버 응답을 기다리기 전에 editor store에서 삭제 대상 서브트리를 제거한다.
    */
    deleteNodeFromStore(getSubtreeClientIds(edges, selectedNode.id));

    /*
    서버에 노드 삭제 요청을 보내고, 실패하면 editor store를 삭제 전 상태로 되돌린다.
    */
    deleteNodeOnServer(
      {
        treeId,
        nodeId: serverId,
      },
      {
        /*
        삭제를 되돌리는 요청은 아직 없어(#117 4단계) undo 기록을 비운다. 삭제 이전으로는 undo할 수 없지만,
        남겨 두면 삭제 전 기록을 undo할 때 지워진 노드를 가리키는 요청이 나가 서버와 어긋난다.
        */
        onSuccess: () => {
          clearEditHistory();
        },
        /*
        서버 요청이 실패하면 삭제 전 구조로 되돌린다. 지운 노드는 삭제 전 값으로 되살아난다.
        */
        onError: () => {
          restoreStructureInStore({ nodes, edges });
          alert("노드 삭제에 실패했습니다.");
        },
      },
    );
  };

  return {
    handleDeleteNode,
    isDeletingNode,
    isDeleteNodeError,
  };
};
