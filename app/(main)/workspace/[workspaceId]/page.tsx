"use client";
import { ReactFlow, ReactFlowProvider, Panel } from "@xyflow/react";
import {
  edgeTypes,
  nodeTypes,
  useEditorLayout,
  useInitializeTree,
  useReactFlowStoreSetters,
  useTreeEditorActions,
  useTreeHistory,
  useTreeStore,
} from "@/src/features/tree-editor";
import { MemoSidePanel } from "@/src/features/memo/ui/MemoSidePanel";
import { useEffect, useState } from "react";
import { useGetTreeQuery } from "@/src/entities/tree/model/queries";

function LayoutFlow() {
  const [isMemoPanelOpen, setIsMemoPanelOpen] = useState(false);
  const treeId = "1"; // todo: treeId 동적 처리
  // todo: React Server Component 사용
  const {
    data: treeData,
    isLoading,
    isError: isGetTreeError,
  } = useGetTreeQuery(treeId);

  // Zustand 스토어에서 상태(State) 구독
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  // Zustand 스토어에서 액션(Actions) 구독
  const onNodesChange = useTreeStore((state) => state.onNodesChange);
  const onEdgesChange = useTreeStore((state) => state.onEdgesChange);
  const onConnect = useTreeStore((state) => state.onConnect);
  const onReconnect = useTreeStore((state) => state.onReconnect);

  const { undo, redo, clear, pause, resume, canUndo, canRedo } =
    useTreeHistory();

  const { setNodes, setEdges } = useReactFlowStoreSetters();

  const {
    selectedNode,
    isAddingNode,
    handleAddNode,
    isDeletingNode,
    handleDeleteNode,
  } = useTreeEditorActions({ treeId });

  // 1. 컴포넌트 마운트 시 일단 기록 중지 (트리 레이아웃 정렬 전 히스토리 기록 방지)
  useEffect(() => {
    pause();
  }, [pause]);

  useInitializeTree({
    treeId,
    treeData,
    clear,
  });

  useEditorLayout(nodes, edges, setNodes, setEdges);

  // 2. React Flow가 초기 노드들의 뷰포트 정렬(fitView)까지 마쳤을 때 히스토리 기록 재개
  const handleInit = () => {
    clear();
    resume();
  };

  const isMutating = isAddingNode || isDeletingNode;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isGetTreeError) {
    return <div>Error loading tree data.</div>;
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="min-h-0 min-w-0 flex-1">
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
          disableKeyboardA11y={isMutating}
          nodesDraggable={!isMutating}
          nodesConnectable={!isMutating}
          edgesReconnectable={!isMutating}
          elementsSelectable={!isMutating}
          fitView
        >
          <Panel position="top-right">
            <button
              className="xy-theme__button"
              onClick={() => undo()}
              disabled={!canUndo || isMutating}
            >
              Undo
            </button>

            <button
              className="xy-theme__button"
              onClick={() => redo()}
              disabled={!canRedo || isMutating}
            >
              Redo
            </button>

            <button
              className="xy-theme__button"
              onClick={handleAddNode}
              disabled={!selectedNode || isMutating}
            >
              Add Node
            </button>

            <button
              className="xy-theme__button"
              onClick={handleDeleteNode}
              disabled={!selectedNode || isMutating}
            >
              Delete Node
            </button>

            <button
              className="xy-theme__button"
              onClick={() => setIsMemoPanelOpen(true)}
              disabled={!selectedNode || isMutating}
            >
              Add Memo
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {isMemoPanelOpen ? (
        <MemoSidePanel
          selectedNode={selectedNode}
          onClose={() => setIsMemoPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <LayoutFlow />
      </ReactFlowProvider>
    </div>
  );
}
