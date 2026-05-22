"use client";
import { ReactFlow, ReactFlowProvider, Panel } from "@xyflow/react";
import {
  nodeTypes,
  edgeTypes,
} from "@/src/features/tree-editor/constants/flowConfig";
import { useEditorLayout } from "@/src/features/tree-editor/hooks/useEditorLayout";
import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";
import {
  useTreeHistory,
  useTreeStore,
} from "@/src/features/tree-editor/model/treeStore";

function LayoutFlow() {
  // Zustand 스토어에서 상태(State) 구독
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  // Zustand 스토어에서 액션(Actions) 구독
  const onNodesChange = useTreeStore((state) => state.onNodesChange);
  const onEdgesChange = useTreeStore((state) => state.onEdgesChange);
  const onConnect = useTreeStore((state) => state.onConnect);
  const onReconnect = useTreeStore((state) => state.onReconnect);
  const onAdd = useTreeStore((state) => state.onAdd);
  const onDelete = useTreeStore((state) => state.onDelete);

  const { undo, redo } = useTreeHistory();

  // UI 제어 파생 상태 계산 (스토어 내부의 최신 nodes 기준)
  const selectedNode = nodes.find((node) => node.selected);
  const isButtonDisabled = !selectedNode;

  // ELK 레이아웃 엔진 훅 연동
  const setNodes = (
    nds:
      | CustomEditorNode[]
      | ((prev: CustomEditorNode[]) => CustomEditorNode[]),
  ) =>
    useTreeStore.setState({
      nodes:
        typeof nds === "function" ? nds(useTreeStore.getState().nodes) : nds,
    });
  const setEdges = (
    eds:
      | CustomEditorEdge[]
      | ((prev: CustomEditorEdge[]) => CustomEditorEdge[]),
  ) =>
    useTreeStore.setState({
      edges:
        typeof eds === "function" ? eds(useTreeStore.getState().edges) : eds,
    });
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
        <button className="xy-theme__button" onClick={() => undo()}>
          Undo
        </button>
        <button className="xy-theme__button" onClick={() => redo()}>
          Redo
        </button>
        <button
          className="xy-theme__button"
          onClick={onAdd}
          disabled={isButtonDisabled}
        >
          add node
        </button>
        <button
          className="xy-theme__button"
          onClick={onDelete}
          disabled={isButtonDisabled}
        >
          delete node
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
