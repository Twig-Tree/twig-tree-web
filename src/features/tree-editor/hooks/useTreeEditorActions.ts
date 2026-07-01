import { useAddNodeMutation } from "@/src/entities/tree/model/mutations/useAddNodeMutation";
import { getNextOrderIndex } from "../lib/node";
import { createEditorNode } from "../lib/add-node/createEditorNode";
import { createEditorEdge } from "../lib/add-node/createEditorEdge";
import { useTreeStore } from "../model/treeStore";

type UseTreeEditorActionsParams = {
  treeId: string;
};

export const useTreeEditorActions = ({
  treeId,
}: UseTreeEditorActionsParams) => {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  const addNodeToStore = useTreeStore((state) => state.onAdd);
  const removeNodeFromStore = useTreeStore((state) => state.onDelete);
  const onDelete = useTreeStore((state) => state.onDelete);

  const {
    mutate: addNodeOnServer,
    isPending: isAddingNode,
    isError: isAddNodeError,
  } = useAddNodeMutation();

  const selectedNode = nodes.find((node) => node.selected);

  const handleAddNode = () => {
    if (!selectedNode) return;

    const nextOrderIndex = getNextOrderIndex(selectedNode.id, nodes, edges);
    const newNodeId = `temp_${crypto.randomUUID()}`; // 임시 ID 생성, onSuccess에서 서버에서 받은 실제 ID로 교체됨
    const label = `Added node ${nextOrderIndex}`;

    const newNode = createEditorNode({
      id: newNodeId,
      label,
      orderIndex: nextOrderIndex,
      x: selectedNode.position.x + 150,
      y: selectedNode.position.y,
    });

    const newEdge = createEditorEdge({
      sourceNodeId: selectedNode.id,
      targetNodeId: newNodeId,
    });

    addNodeToStore(newNode, newEdge);

    addNodeOnServer(
      {
        treeId,
        node: {
          parentId: Number(selectedNode.id),
          orderId: nextOrderIndex,
          name: label,
        },
      },
      {
        onSuccess: (createdNode) => {
          const realNodeId = String(createdNode.nodeId);

          useTreeStore.setState((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === newNodeId
                ? {
                    ...node,
                    id: realNodeId,
                    data: {
                      ...node.data,
                    },
                  }
                : node,
            ),
            edges: state.edges.map((edge) =>
              edge.target === newNodeId
                ? {
                    ...edge,
                    id: `e-${edge.source}-${realNodeId}`,
                    target: realNodeId,
                  }
                : edge,
            ),
          }));
        },
        onError: () => {
          removeNodeFromStore(newNode);
          alert("노드 추가에 실패했습니다.");
        },
      },
    );
  };

  return {
    selectedNode,
    isAddingNode,
    isAddNodeError,
    handleAddNode,
    handleDeleteNode: onDelete,
  };
};
