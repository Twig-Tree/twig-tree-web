"use client";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import {
  DropIndicatorOverlay,
  EditorToolbar,
  MemoSidePanel,
  NodeContextMenu,
  edgeTypes,
  MIN_ZOOM,
  nodeTypes,
  useEditorLayout,
  useFocusNode,
  useInitializeTree,
  useNodeContextMenu,
  useMoveNodeByDrag,
  useReactFlowStoreSetters,
  useSyncCollapseAcrossTabs,
  useTreeEditorActions,
  useTreeStore,
  useVisibleElements,
  type NodeResult,
} from "@/src/features/tree-editor";
import { use, useRef } from "react";
import { useGetTreeQuery } from "@/src/entities/tree/model/queries";
import { useGetWorkspaceQuery } from "@/src/entities/workspace";
import { isClientError } from "@/src/shared/api/httpErrors";
import { isValidApiId } from "@/src/shared/lib/validation/isValidApiId";
import {
  WorkspaceHeader,
  WorkspaceLoadError,
  WorkspacePanel,
  WorkspacePanelOpenButton,
  useResponsivePanelVisibility,
} from "@/src/widgets/workspace";

interface LayoutFlowProps {
  workspaceId: string;
  treeId: string | null; // 트리가 없는 워크스페이스는 null
}

function LayoutFlow({ workspaceId, treeId }: LayoutFlowProps) {
  /*
  메모 패널은 노드를 골라야 의미가 있으므로 사용자가 열 때만 연다. 화면이 좁아지면 검색 패널과 함께 닫는다.
  closePanel은 렌더마다 새로 만들어지지 않으므로 useVisibleElements의 effect를 다시 돌리지 않는다.
  */
  const {
    isPanelOpen: isMemoPanelOpen,
    isPanelOverlay: isMemoPanelOverlay,
    openPanel: openMemoPanel,
    closePanel: closeMemoPanel,
  } = useResponsivePanelVisibility({ isOpenOnWideScreen: false });
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

  const { setNodes } = useReactFlowStoreSetters();

  const {
    selectedNode,
    isAddingNode,
    isAddNodeEnabled,
    handleAddNode,
    isDeletingNode,
    handleDeleteNode,
    moveNode,
    isMovingNode,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    isUndoingOrRedoing,
  } = useTreeEditorActions({ workspaceId, treeId });

  useInitializeTree({
    treeId,
    treeData,
  });

  useSyncCollapseAcrossTabs();

  /*
  접힌 노드의 하위 노드는 레이아웃 계산과 화면 표시에서 함께 뺀다. 레이아웃에 남기면 접힌 자리가 빈 공간으로 남는다.
  */
  const { visibleNodes, visibleEdges } = useVisibleElements({
    nodes,
    edges,
    onSelectedNodeHidden: closeMemoPanel,
  });

  const { fitTreeView, runAfterNextLayout, isLayoutRunning } = useEditorLayout(
    visibleNodes,
    visibleEdges,
    setNodes,
  );

  const { focusNode, fitNodes } = useFocusNode({
    visibleNodes,
    runAfterNextLayout,
    isLayoutRunning,
  });

  /*
  노드를 끌어 놓으면 위치가 아니라 부모와 순서가 바뀐다. 레이아웃 계산에는 visibleNodes를 그대로 쓰고,
  화면에는 루트를 끌 수 없게 표시한 draggableNodes를 넘긴다.
  */
  const {
    draggableNodes,
    dropIndicator,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  } = useMoveNodeByDrag({ treeId, visibleNodes, visibleEdges, moveNode });

  /*
  결과로 고른 노드를 선택하고 화면 가운데로 옮긴다. 메모에서 일치한 노드는 일치한 내용을 바로 볼 수 있도록 메모 패널도 연다.
  */
  const handleSelectResult = (result: NodeResult) => {
    focusNode(result.clientId);

    if (result.isMemoMatched) openMemoPanel();
  };

  const isMutating =
    isAddingNode || isDeletingNode || isMovingNode || isUndoingOrRedoing;

  const { isPanelOpen, isPanelOverlay, openPanel, closePanel } =
    useResponsivePanelVisibility({ isOpenOnWideScreen: true });

  /*
  좁은 화면에서 양옆 패널은 캔버스 위에 겹쳐 뜨므로, 캔버스 빈 곳을 누르면 닫아 다시 캔버스를 보여 준다.
  */
  const handlePaneClick = () => {
    if (isPanelOverlay) closePanel();
    if (isMemoPanelOverlay) closeMemoPanel();
  };

  const canvasRef = useRef<HTMLDivElement>(null);
  const { contextMenu, handleNodeContextMenu, closeContextMenu } =
    useNodeContextMenu({ containerRef: canvasRef, isDisabled: isMutating });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isGetTreeError) {
    return <div>Error loading tree data.</div>;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full">
      <WorkspacePanel
        onSelectResult={handleSelectResult}
        isResultSelectDisabled={isMutating}
        onFitNodes={fitNodes}
        isOpen={isPanelOpen}
        isOverlay={isPanelOverlay}
        onClose={closePanel}
      />

      <div
        ref={canvasRef}
        className="@container relative min-h-0 min-w-0 flex-1"
      >
        <ReactFlow
          nodes={draggableNodes}
          edges={visibleEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={MIN_ZOOM}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={(event, node, draggedNodes) => {
            closeContextMenu();
            onNodeDragStart(event, node, draggedNodes);
          }}
          onNodeContextMenu={handleNodeContextMenu}
          onMoveStart={closeContextMenu}
          onPaneClick={handlePaneClick}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          disableKeyboardA11y={isMutating}
          nodesDraggable={!isMutating}
          /*
          부모와 순서는 노드를 끌어 바꾼다. 엣지를 잇거나 끝을 옮기는 편집은 서버에 저장할 수 없어 막는다.
          */
          nodesConnectable={false}
          edgesReconnectable={false}
          elementsSelectable={!isMutating}
        >
          {/*
          도트 색은 테마가 정한다. 바탕은 캔버스의 테마 이미지가 보이도록 투명하게 둔다.
          */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={0.8}
            bgColor="transparent"
          />
          <DropIndicatorOverlay indicator={dropIndicator} />

          {isPanelOpen ? null : (
            <Panel position="top-left">
              <WorkspacePanelOpenButton onOpen={openPanel} />
            </Panel>
          )}

          <Panel position="top-right">
            <EditorToolbar
              onUndo={handleUndo}
              onRedo={handleRedo}
              onFitView={fitTreeView}
              onAddRootNode={nodes.length === 0 ? handleAddNode : undefined}
              isUndoDisabled={!canUndo || isMutating}
              isRedoDisabled={!canRedo || isMutating}
              isAddRootNodeDisabled={!isAddNodeEnabled || isMutating}
            />
          </Panel>
        </ReactFlow>

        {/*
        노드 추가·삭제·메모는 우클릭한 노드를 대상으로 한다. 메뉴를 열 때 그 노드를 선택해 두므로 handler는 선택된 노드를 기준으로 동작한다.
        */}
        {contextMenu ? (
          <NodeContextMenu
            key={contextMenu.clientId}
            x={contextMenu.x}
            y={contextMenu.y}
            onOpenMemo={openMemoPanel}
            onAddNode={handleAddNode}
            onDeleteNode={handleDeleteNode}
            onClose={closeContextMenu}
            isAddNodeDisabled={!isAddNodeEnabled || isMutating}
            isDeleteNodeDisabled={!selectedNode || isMutating}
          />
        ) : null}
      </div>

      {/*
      메모 패널은 노드를 선택해야 열리므로 트리가 없으면 열릴 수 없다. 저장 요청에 treeId가 필요해 타입을 좁힌다.
      */}
      {isMemoPanelOpen && treeId !== null ? (
        <MemoSidePanel
          treeId={treeId}
          selectedNode={selectedNode}
          onClose={closeMemoPanel}
          isOverlay={isMemoPanelOverlay}
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

  /*
  주소창에서 온 ID라 형식부터 검사한다. 잘못되면 하위 화면을 그리지 않아 조회 요청 자체가 만들어지지 않는다.
  형식이 틀린 ID도 사용자에게는 없는 워크스페이스와 같으므로 서버 404와 같은 안내를 쓴다.
  */
  if (!isValidApiId(workspaceId)) {
    return <WorkspaceLoadError isNotFound />;
  }

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
            <LayoutFlow workspaceId={workspaceId} treeId={workspace.treeId} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
