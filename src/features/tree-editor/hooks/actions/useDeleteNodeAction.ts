import { useDeleteNodeMutation } from "@/src/entities/tree/model/mutations/useDeleteNodeMutation";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

interface UseDeleteNodeActionParams {
  treeId: string; // 노드를 삭제할 트리 ID
  selectedNode: CustomEditorNode | undefined; // 삭제 기준이 되는 선택 노드
}

/*
함수 이름 : useDeleteNodeAction
기능 : 선택된 노드를 루트로 하는 서브트리를 optimistic update로 editor store에서 삭제하고, 서버 요청 실패 시 삭제 전 상태로 rollback한다.
인자 : UseDeleteNodeActionParams
반환값 : 노드 삭제 핸들러와 노드 삭제 mutation 상태
*/
export const useDeleteNodeAction = ({
  treeId,
  selectedNode,
}: UseDeleteNodeActionParams) => {
  const deleteNodeFromStore = useTreeStore(
    (state) => state.deleteNodeFromStore,
  );
  const {
    mutate: deleteNodeOnServer,
    isPending: isDeletingNode,
    isError: isDeleteNodeError,
  } = useDeleteNodeMutation();

  /*
  선택된 노드를 기준으로 삭제할 서브트리를 찾고 서버에 노드 삭제 요청을 보낸다.
  */
  const handleDeleteNode = () => {
    if (!selectedNode || isDeletingNode) return;

    const serverNodeId = Number(selectedNode.id); // 서버 요청에 사용할 삭제 대상 노드 ID를 숫자로 검증한다.
    if (Number.isNaN(serverNodeId)) {
      alert("아직 서버에 저장되지 않은 노드입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const edges = useTreeStore.getState().edges;

    const hasParent = edges.some((edge) => edge.target === selectedNode.id); // 부모 엣지가 없으면 루트 노드로 판단한다.

    if (!hasParent) {
      alert("루트 노드는 삭제할 수 없습니다.");
      return;
    }

    /*
    삭제 대상 노드를 시작점으로 삼아 서브트리에 포함된 모든 노드 ID를 수집한다.
    */
    const idsToDelete = new Set<string>([selectedNode.id]);
    const queue = [selectedNode.id];

    /*
    현재 노드를 source로 가지는 엣지를 따라가며 자식 노드 ID를 삭제 대상에 추가한다.
    */
    while (queue.length > 0) {
      const currentId = queue.shift()!;

      edges.forEach((edge) => {
        if (edge.source === currentId) {
          idsToDelete.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    /*
    서버 응답을 기다리기 전에 editor store에서 삭제 대상 서브트리를 제거한다.
    */
    deleteNodeFromStore(Array.from(idsToDelete));

    /*
    서버에 노드 삭제 요청을 보내고, 실패하면 editor store를 삭제 전 상태로 되돌린다.
    */
    deleteNodeOnServer(
      {
        treeId,
        nodeId: selectedNode.id,
      },
      {
        /*
        서버 요청이 실패하면 삭제 전의 editor store 상태로 복구한다.
        */
        onError: () => {
          useTreeStore.temporal.getState().undo();
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
