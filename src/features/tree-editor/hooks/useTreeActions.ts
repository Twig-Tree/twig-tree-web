import { useCallback, Dispatch, SetStateAction } from "react";
import { addEdge, OnConnect, OnReconnect, reconnectEdge } from "@xyflow/react";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";
import { isDuplicateEdge } from "@/src/features/tree-editor/lib/edge";
import { getNextOrderIndex } from "@/src/features/tree-editor/lib/node";
import { hasCycle } from "@/src/features/tree-editor/lib/checkCycle";

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
      const potentialEdges: CustomEditorEdge[] = [
        ...edges,
        {
          id: `e-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
        },
      ];
      if (hasCycle(nodes, potentialEdges)) {
        alert("순환 참조는 허용되지 않습니다. (트리 구조 유지)");
        return;
      }

      if (isDuplicateEdge(edges, connection.source, connection.target)) {
        alert("이미 연결된 노드입니다.");
        return;
      }

      setEdges((eds) => addEdge(connection, eds));
    },
    [nodes, edges, setEdges],
  );

  const onReconnect: OnReconnect<CustomEditorEdge> = useCallback(
    (oldEdge, newConnection) => {
      const potentialEdges: CustomEditorEdge[] = [
        ...edges.filter((e) => e.id !== oldEdge.id),
        { ...newConnection, id: oldEdge.id },
      ];
      if (hasCycle(nodes, potentialEdges)) {
        alert("순환 참조는 허용되지 않습니다. (트리 구조 유지)");
        return;
      }

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
    [nodes, edges, setEdges],
  );

  const onAdd = useCallback(() => {
    if (!selectedNode) return;

    const nextOrderIndex = getNextOrderIndex(selectedNode.id, nodes, edges);

    const newNodeId = getNodeId();
    const newNode = {
      id: newNodeId,
      type: "custom",
      data: {
        label: `Added node ${nextOrderIndex}`,
        orderIndex: nextOrderIndex,
      },
      // 부모 노드 근처에 생성 (이후 ELK 레이아웃 동작)
      position: {
        x: selectedNode.position.x + 150,
        y: selectedNode.position.y,
      },
    };

    const newEdge = {
      id: `e-${selectedNode.id}-${newNodeId}`,
      type: "smoothstep",
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
  }, [selectedNode, setNodes, setEdges, nodes, edges]);

  return { onConnect, onReconnect, onAdd, isButtonDisabled };
}
