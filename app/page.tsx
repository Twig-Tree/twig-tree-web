"use client";
import { useState, useCallback } from "react";
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type FitViewOptions,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type OnNodeDrag,
  type DefaultEdgeOptions,
} from "@xyflow/react";
import { CustomNode } from "@/src/components/CustomNode";
import { CustomEdgeType, CustomNodeType } from "@/src/types/custom-node";
import { CustomEdge } from "@/src/components/CustomEdge";

const initialNodes: CustomNodeType[] = [
  {
    id: "n1",
    type: "custom",
    data: { label: "Node 1" },
    position: { x: 5, y: 5 },
  },
  {
    id: "n2",
    type: "custom",
    data: { label: "Node 2" },
    position: { x: 200, y: 5 },
  },
];

const initialEdges: CustomEdgeType[] = [
  { id: "e1", type: "custom", source: "n1", target: "n2" },
];

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
};

const onNodeDrag: OnNodeDrag<CustomNodeType> = (_, node) => {
  console.log("drag event", node.data);
};

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function Home() {
  const [nodes, setNodes] = useState<CustomNodeType[]>(initialNodes);
  const [edges, setEdges] = useState<CustomEdgeType[]>(initialEdges);

  const onNodesChange: OnNodesChange<CustomNodeType> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange<CustomEdgeType> = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
      />
    </div>
  );
}
