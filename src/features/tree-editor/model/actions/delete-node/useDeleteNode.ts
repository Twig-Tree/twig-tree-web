import { useDeleteNodeMutation } from "@/src/entities/tree/model/mutations/useDeleteNodeMutation";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";
import { getSubtreeClientIds } from "../../../lib/getSubtreeClientIds";
import { getNodePlacement } from "../../../lib/move-node/getNodePlacement";
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
  const recordEdit = useEditHistoryStore((state) => state.record);
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

    const placement = getNodePlacement(nodes, edges, selectedNode.id);

    if (!placement) {
      alert("루트 노드는 삭제할 수 없습니다.");
      return;
    }

    const subtreeClientIds = new Set(
      getSubtreeClientIds(edges, selectedNode.id),
    );

    /*
    서버 응답을 기다리기 전에 editor store에서 삭제 대상 서브트리를 제거한다.
    */
    deleteNodeFromStore(Array.from(subtreeClientIds));

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
        지운 노드는 메모·태그까지 data째 기록한다. undo는 이 값으로 하위 트리를 다시 만든다.
        하위 트리 루트로 들어오던 엣지도 함께 남겨, 다시 넣을 때 부모와 이어지게 한다.
        */
        onSuccess: () => {
          recordEdit({
            type: "delete",
            clientId: selectedNode.id,
            placement,
            nodes: nodes.filter((node) => subtreeClientIds.has(node.id)),
            edges: edges.filter((edge) => subtreeClientIds.has(edge.target)),
          });
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
