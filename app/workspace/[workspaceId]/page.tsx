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
import { useEffect } from "react";
import { useGetTreeQuery } from "@/src/entities/tree/model/queries";
import {
  mapToVisualNodes,
  mapToVisualEdges,
} from "@/src/features/tree-editor/lib/mappers";
import { mapNodesDtoToDomain } from "@/src/entities/tree/lib/mappers";
import { useReactFlowStoreSetters } from "@/src/features/tree-editor/hooks/useReactFlowStoreSetters";

function LayoutFlow() {
  // todo: treeId 동적 처리
  // todo: React Server Component 사용
  const { data: treeData, isLoading, isError } = useGetTreeQuery("1");

  // Zustand 스토어에서 상태(State) 구독
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  // Zustand 스토어에서 액션(Actions) 구독
  const initializeTree = useTreeStore((state) => state.initializeTree);
  const onNodesChange = useTreeStore((state) => state.onNodesChange);
  const onEdgesChange = useTreeStore((state) => state.onEdgesChange);
  const onConnect = useTreeStore((state) => state.onConnect);
  const onReconnect = useTreeStore((state) => state.onReconnect);
  const onAdd = useTreeStore((state) => state.onAdd);
  const onDelete = useTreeStore((state) => state.onDelete);

  const { undo, redo, clear, pause, resume, canUndo, canRedo } =
    useTreeHistory();

  const { setNodes, setEdges } = useReactFlowStoreSetters();

  // 1. 컴포넌트 마운트 시 일단 기록 중지 (트리 레이아웃 정렬 전 히스토리 기록 방지)
  useEffect(() => {
    pause();
  }, [pause]);

  useEffect(() => {
    if (!treeData) return;

    const domainNodes = mapNodesDtoToDomain(treeData);
    const visualNodes = mapToVisualNodes(domainNodes);
    const visualEdges = mapToVisualEdges(domainNodes);

    initializeTree({
      treeId: "1", // todo: treeId 동적 처리
      nodes: visualNodes,
      edges: visualEdges,
    });

    clear();
  }, [treeData, initializeTree, clear]);

  // 2. React Flow가 초기 노드들의 뷰포트 정렬(fitView)까지 마쳤을 때 히스토리 기록 재개
  const handleInit = () => {
    clear();
    resume();
  };

  // UI 제어 파생 상태 계산 (스토어 내부의 최신 nodes 기준)
  const selectedNode = nodes.find((node) => node.selected);
  const isButtonDisabled = !selectedNode;

  useEditorLayout(nodes, edges, setNodes, setEdges);

  return isLoading ? (
    <div>Loading...</div> // todo: 로딩 처리
  ) : isError ? (
    <div>Error loading tree data.</div> // todo: 에러 처리
  ) : (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onInit={handleInit}
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
          onClick={() => undo()}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          className="xy-theme__button"
          onClick={() => redo()}
          disabled={!canRedo}
        >
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
