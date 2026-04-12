"use client";
import { useCallback, useLayoutEffect } from "react";
import {
  ReactFlow,
  addEdge,
  type OnConnect,
  type OnReconnect,
  useNodesState,
  useEdgesState,
  Position,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  Panel,
} from "@xyflow/react";
import { CustomNode } from "@/src/components/CustomNode";
import { CustomEdgeType, CustomNodeType } from "@/src/types/custom-node";
import { CustomEdge } from "@/src/components/CustomEdge";
import { initialNodes, initialEdges } from "./initialElements";
import ELK from "elkjs/lib/elk.bundled.js";

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

type direction = "RIGHT" | "DOWN";

const elk = new ELK();

const elkOptions = {
  "elk.algorithm": "layered", // 노드들을 층(layer)별로 나누어 배치하는 알고리즘
  "elk.layered.spacing.nodeNodeBetweenLayers": "100", // 층 사이의 간격
  "elk.spacing.nodeNode": "80", // 노드 간의 간격
};

const getLayoutedElements = async (
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
  options: Record<string, string> = {},
): Promise<{ nodes: CustomNodeType[]; edges: CustomEdgeType[] }> => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";
  const graph = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node: CustomNodeType) => ({
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      width: 150,
      height: 50,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  return elk
    .layout(graph)
    .then((layoutedGraph) => ({
      nodes: (layoutedGraph.children ?? []).map((node) => ({
        ...node,
        position: { x: node.x ?? 0, y: node.y ?? 0 },
      })),
      edges: layoutedGraph.edges,
    }))
    .catch((err) => {
      console.error(err);
      return { nodes, edges };
    });
};

function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeType>([]);
  const { fitView } = useReactFlow();

  const selectedNode = nodes.find((node) => node.selected);
  const isButtonDisabled = !selectedNode;
  const getNodeId = () => `randomnode_${+new Date()}`;

  const onReconnect: OnReconnect<CustomEdgeType> = useCallback(
    (oldEdge, newConnection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));

      // 이전 부모 노드가 isLeaf가 되는지 확인
      const oldNodeId = oldEdge.source;
      const newNodeId = newConnection.source;

      if (oldNodeId === newNodeId) return;

      setNodes((nds) =>
        nds.map((node) => {
          // 새로운 부모 노드 isLeaf 해제
          if (node.id === newNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label: node.data.label ?? "",
                isLeaf: false,
              },
            };
          }

          // 이전 부모 노드 isLeaf 설정
          if (node.id === oldNodeId) {
            const hasOtherChildren = edges.some(
              (e) => e.source === oldNodeId && e.id !== oldEdge.id,
            );

            if (!hasOtherChildren) {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: node.data.label ?? "",
                  isLeaf: true,
                },
              };
            }
          }
          return node;
        }),
      );
    },
    [edges, setEdges, setNodes],
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

    const newEdge: CustomEdgeType = {
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
        .concat(newNode),
    );
    setEdges((eds) => eds.concat(newEdge));
  }, [selectedNode, setNodes, setEdges]);

  const onLayout = useCallback(
    ({
      direction,
      useInitialNodes = false,
    }: {
      direction: direction;
      useInitialNodes?: boolean;
    }) => {
      const opts = { "elk.direction": direction, ...elkOptions };
      const ns = useInitialNodes ? initialNodes : nodes;
      const es = useInitialNodes ? initialEdges : edges;

      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          fitView();
        },
      );
    },
    [nodes, edges, setNodes, setEdges, fitView],
  );

  useLayoutEffect(() => {
    onLayout({ direction: "RIGHT", useInitialNodes: nodes.length === 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onReconnect={onReconnect}
      fitView
    >
      <Panel position="top-right">
        <button
          className="xy-theme__button"
          onClick={onAdd}
          disabled={isButtonDisabled}
        >
          add node
        </button>
      </Panel>
    </ReactFlow>
  );
}

export default function Home() {
  return (
    <div className="w-full h-screen">
      <ReactFlowProvider>
        <LayoutFlow />
      </ReactFlowProvider>
    </div>
  );
}
