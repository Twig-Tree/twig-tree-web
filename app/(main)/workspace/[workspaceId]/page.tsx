"use client";
import { ReactFlow, ReactFlowProvider, Panel } from "@xyflow/react";
import {
  MemoSidePanel,
  edgeTypes,
  nodeTypes,
  useEditorLayout,
  useInitializeTree,
  useReactFlowStoreSetters,
  useTreeEditorActions,
  useTreeHistory,
  useTreeStore,
} from "@/src/features/tree-editor";
import { use, useEffect, useState } from "react";
import { useGetTreeQuery } from "@/src/entities/tree/model/queries";
import { useGetWorkspaceQuery } from "@/src/entities/workspace";
import { isClientError } from "@/src/shared/api/httpErrors";
import { WorkspaceHeader, WorkspaceLoadError } from "@/src/widgets/workspace";

interface LayoutFlowProps {
  treeId: string | null; // 트리가 없는 워크스페이스는 null
}

function LayoutFlow({ treeId }: LayoutFlowProps) {
  const [isMemoPanelOpen, setIsMemoPanelOpen] = useState(false);
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

  const { setNodes } = useReactFlowStoreSetters();

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

  useEditorLayout(nodes, edges, setNodes);

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

      {/*
      메모 패널은 노드를 선택해야 열리므로 트리가 없으면 열릴 수 없다. 저장 요청에 treeId가 필요해 타입을 좁힌다.
      */}
      {isMemoPanelOpen && treeId !== null ? (
        <MemoSidePanel
          treeId={treeId}
          selectedNode={selectedNode}
          onClose={() => setIsMemoPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = use(params);

  return (
    // App Router의 클라이언트 내비게이션에서는 컴포넌트 상태가 보존될 수 있다.
    // workspaceId를 key로 사용해 다른 워크스페이스로 이동하면 편집기를 새로 마운트한다.
    <WorkspacePageContent key={workspaceId} workspaceId={workspaceId} />
  );
}

interface WorkspacePageContentProps {
  workspaceId: string;
}

function WorkspacePageContent({ workspaceId }: WorkspacePageContentProps) {
  const {
    data: workspace,
    error: getWorkspaceError,
    isPending,
    isError: isGetWorkspaceError,
    refetch,
  } = useGetWorkspaceQuery(workspaceId);

  /*
  조회에 실패하면 헤더 바와 편집기를 그리지 않는다. 4xx는 다시 요청해도 같으므로 다시 시도 대신 대시보드로 안내한다.
  데이터가 없는 query를 refetch하면 오류가 지워지고 pending으로 돌아가므로, 다시 시도 중에는 아래 로딩 화면이 보인다.
  */
  if (isGetWorkspaceError) {
    return (
      <WorkspaceLoadError
        isNotFound={isClientError(getWorkspaceError)}
        onRetry={() => void refetch()}
      />
    );
  }

  /*
  isLoading은 요청 중일 때만 true라, 네트워크가 끊겨 요청이 일시정지되면 데이터 없이 false가 된다.
  isPending으로 분기해야 그 상태도 로딩으로 보이고, 이 분기를 지나면 workspace가 성공 데이터로 좁혀진다.
  */
  return (
    <div className="flex h-full w-full flex-col">
      <WorkspaceHeader name={workspace?.name} isNameLoading={isPending} />

      <div className="min-h-0 flex-1">
        {isPending ? (
          <div>Loading...</div>
        ) : (
          <ReactFlowProvider>
            {/*
            트리가 없는 워크스페이스도 같은 편집기로 그린다. 트리 조회는 보내지 않고 빈 캔버스와 버튼 패널만 보인다.
            트리를 만들면 treeId만 바뀌므로 편집기를 갈아 끼우지 않아 store가 유지된다.
            */}
            <LayoutFlow treeId={workspace.treeId} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
