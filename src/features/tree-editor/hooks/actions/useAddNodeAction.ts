import { useAddNodeMutation } from "@/src/entities/tree/model/mutations/useAddNodeMutation";
import { createEditorEdge } from "../../lib/add-node/createEditorEdge";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { getNextOrderIndex } from "../../lib/node";
import { useTreeStore } from "../../model/treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

type UseAddNodeActionParams = {
  treeId: string;
  selectedNode: CustomEditorNode | undefined;
  nodes: CustomEditorNode[];
  edges: CustomEditorEdge[];
};

export const useAddNodeAction = ({
  treeId,
  selectedNode,
  nodes,
  edges,
}: UseAddNodeActionParams) => {
  const addNodeToStore = useTreeStore((state) => state.onAdd);
  const rollbackAdd = useTreeStore((state) => state.rollbackAdd);

  const {
    mutate: addNodeOnServer,
    isPending: isAddingNode,
    isError: isAddNodeError,
  } = useAddNodeMutation();

  const handleAddNode = () => {
    if (!selectedNode) return;

    const nextOrderIndex = getNextOrderIndex(selectedNode.id, nodes, edges);
    const newNodeId = `temp_${crypto.randomUUID()}`;
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

    const wasDirtyBeforeAdd = useTreeStore.getState().isDirty;

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
          rollbackAdd(newNodeId, wasDirtyBeforeAdd);
          alert("노드 추가에 실패했습니다.");
        },
      },
    );
  };

  return {
    handleAddNode,
    isAddingNode,
    isAddNodeError,
  };
};
