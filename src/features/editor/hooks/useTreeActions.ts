import { useCallback, Dispatch, SetStateAction } from "react";
import { addEdge, OnConnect, OnReconnect, reconnectEdge } from "@xyflow/react";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/editor/types";
import { isDuplicateEdge } from "@/src/domains/tree/utils/edge";

export function useTreeActions(
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  setNodes: Dispatch<SetStateAction<CustomEditorNode[]>>,
  setEdges: Dispatch<SetStateAction<CustomEditorEdge[]>>,
) {
  const selectedNode = nodes.find((node) => node.selected);
  const isButtonDisabled = !selectedNode;
  const getNodeId = () => `randomnode_${+new Date()}`;

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (isDuplicateEdge(edges, connection.source, connection.target)) {
        alert("이미 연결된 노드입니다.");
        return;
      }
      setEdges((eds) => addEdge(connection, eds));
    },
    [edges, setEdges],
  );

  const onReconnect: OnReconnect<CustomEditorEdge> = useCallback(
    (oldEdge, newConnection) => {
      if (
        isDuplicateEdge(
          edges,
          newConnection.source,
          newConnection.target,
          oldEdge.id,
        )
      ) {
        alert("이미 연결된 노드입니다.");
        return;
      }
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [edges, setEdges],
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
                },
              }
            : node,
        )
        .concat(newNode as unknown as CustomEditorNode),
    );
    setEdges((eds) => eds.concat(newEdge as unknown as CustomEditorEdge));
  }, [selectedNode, setNodes, setEdges]);

  return { onConnect, onReconnect, onAdd, isButtonDisabled };
}
