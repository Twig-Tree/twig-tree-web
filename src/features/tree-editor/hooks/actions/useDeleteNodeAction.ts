import { useDeleteNodeMutation } from "@/src/entities/tree/model/mutations/useDeleteNodeMutation";
import { useTreeStore } from "@/src/features/tree-editor/model/treeStore";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

interface UseDeleteNodeActionParams {
  treeId: string;
  selectedNode: CustomEditorNode | undefined;
}

export const useDeleteNodeAction = ({
  treeId,
  selectedNode,
}: UseDeleteNodeActionParams) => {
  const deleteNodeFromStore = useTreeStore(
    (state) => state.deleteNodeFromStore,
  );
  const rollbackDeleteNode = useTreeStore((state) => state.rollbackDeleteNode);

  const {
    mutate: deleteNodeOnServer,
    isPending: isDeletingNode,
    isError: isDeleteNodeError,
  } = useDeleteNodeMutation();

  const handleDeleteNode = () => {
    if (!selectedNode || isDeletingNode) return;

    const serverNodeId = Number(selectedNode.id);
    if (Number.isNaN(serverNodeId)) return;

    const {
      nodes: prevNodes,
      edges: prevEdges,
      isDirty: wasDirtyBeforeDelete,
    } = useTreeStore.getState();

    const hasParent = prevEdges.some((edge) => edge.target === selectedNode.id);

    if (!hasParent) {
      alert("루트 노드는 삭제할 수 없습니다.");
      return;
    }

    /*
    지울 대상을 모아둘 블랙리스트(Set)와 탐색용 바구니(Queue) 초기화
    */
    const idsToDelete = new Set<string>([selectedNode.id]);
    const queue = [selectedNode.id];

    /*
    평면 엣지 데이터를 기반으로 트리 아래 방향(BFS)으로 순회하며 자식 ID 수집
    */
    while (queue.length > 0) {
      const currentId = queue.shift()!;

      prevEdges.forEach((edge) => {
        // 현재 노드가 출발지(source)라면 목적지(target)는 자식 노드이므로 삭제 대상으로 추가
        if (edge.source === currentId) {
          idsToDelete.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    deleteNodeFromStore(Array.from(idsToDelete));

    deleteNodeOnServer(
      {
        treeId,
        nodeId: selectedNode.id,
      },
      {
        onError: () => {
          rollbackDeleteNode({
            previousNodes: prevNodes,
            previousEdges: prevEdges,
            previousIsDirty: wasDirtyBeforeDelete,
          });
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
