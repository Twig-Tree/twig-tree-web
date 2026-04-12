import { useCallback, Dispatch, SetStateAction } from "react";
import { addEdge, OnConnect, OnReconnect, reconnectEdge } from "@xyflow/react";
import { CustomEdgeType, CustomNodeType } from "@/src/domains/tree/types";

export function useTreeActions(
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
  setNodes: Dispatch<SetStateAction<CustomNodeType[]>>,
  setEdges: Dispatch<SetStateAction<CustomEdgeType[]>>
) {
  const selectedNode = nodes.find((node) => node.selected);
  const isButtonDisabled = !selectedNode;
  const getNodeId = () => `randomnode_${+new Date()}`;

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const onReconnect: OnReconnect<CustomEdgeType> = useCallback(
    (oldEdge, newConnection) => setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds)),
    [setEdges],
  );

  const onAdd = useCallback(() => {
    if (!selectedNode) return;

    const newNodeId = getNodeId();
    const newNode = {
      id: newNodeId,
      type: "custom",
      data: { label: "Added node", isLeaf: true },
      // 부모 노드 근처에 생성 (이후 ELK 레이아웃 동작)
      position: {
        x: selectedNode.position.x + 150,
        y: selectedNode.position.y,
      },
    };

    const newEdge = {
      id: `e-${selectedNode.id}-${newNodeId}`,
      type: "custom",
      source: selectedNode.id,
      target: newNodeId,
    };

    setNodes((nds) =>
      nds
        .map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: node.data.label ?? "",
                  isLeaf: false,
                },
              }
            : node,
        )
        .concat(newNode as unknown as CustomNodeType),
    );
    setEdges((eds) => eds.concat(newEdge as unknown as CustomEdgeType));
  }, [selectedNode, setNodes, setEdges]);

  return { onConnect, onReconnect, onAdd, isButtonDisabled };
}
