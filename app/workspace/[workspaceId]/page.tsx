"use client";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import {
  nodeTypes,
  edgeTypes,
} from "@/src/features/tree-editor/constants/flowConfig";
import { useTreeActions } from "@/src/features/tree-editor/hooks/useTreeActions";
import { useEditorLayout } from "@/src/features/tree-editor/hooks/useEditorLayout";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";

function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomEditorNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEditorEdge>([]);

  const { onConnect, onReconnect, onAdd, isButtonDisabled } = useTreeActions(
    nodes,
    edges,
    setNodes,
    setEdges,
  );

  useEditorLayout(nodes, edges, setNodes, setEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
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

export default function WorkspacePage() {
  return (
    <div className="w-full h-screen">
      <ReactFlowProvider>
        <LayoutFlow />
      </ReactFlowProvider>
    </div>
  );
}
