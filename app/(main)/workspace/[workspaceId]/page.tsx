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
  EmptyTreeGuide,
  LecturePlayer,
  MemoSidePanel,
  NodeActionToolbar,
  NodeContextMenu,
  ShortcutGuide,
  edgeTypes,
  MIN_ZOOM,
  nodeTypes,
  useEditorLayout,
  useFocusNode,
  useInitializeTree,
  useIsLectureActive,
  useLectureScript,
  useNodeActions,
  useNodeActionShortcuts,
  useNodeContextMenu,
  useMoveNodeByDrag,
  usePanelCameraAlignment,
  useReactFlowStoreSetters,
  useSyncCollapseAcrossTabs,
  useSyncExternalTreeChange,
  useTreeEditorActions,
  useTreeLevelControl,
  useTreeStore,
  useNodeTransition,
  useVisibleElements,
  type NodeActionId,
  type NodeResult,
} from "@/src/features/tree-editor";
import { use, useCallback, useRef, useState } from "react";
import { useGetTreeQuery } from "@/src/entities/tree/model/queries";
import { useGetWorkspaceQuery } from "@/src/entities/workspace";
import {
  CanvasOnboardingHint,
  CanvasOnboardingTour,
} from "@/src/features/onboarding";
import { PromptComposer } from "@/src/features/prompt/compose-prompt";
import { useFillWorkspaceTree } from "@/src/features/prompt/fill-workspace-tree";
import { isClientError } from "@/src/shared/api/httpErrors";
import { isValidApiId } from "@/src/shared/lib/validation/isValidApiId";
import {
  WorkspaceHeader,
  WorkspaceLoadError,
  WorkspacePanel,
  WorkspacePanelOpenButton,
  useIsNarrowScreen,
  useResponsivePanelVisibility,
} from "@/src/widgets/workspace";
import { TreeCreatingNotice } from "@/src/widgets/dashboard";

interface LayoutFlowProps {
  workspaceId: string;
  treeId: string | null; // 트리가 없는 워크스페이스는 null
}

function LayoutFlow({ workspaceId, treeId }: LayoutFlowProps) {
  /*
  메모 패널은 노드를 골라야 의미가 있으므로 사용자가 열 때만 연다. 닫히면 저장하지 않은 초안이 사라지므로
  화면이 좁아져도 닫지 않고, 캔버스 위에 겹쳐 띄우기만 한다.
  */
  const [isMemoPanelOpen, setIsMemoPanelOpen] = useState(false);
  const openMemoPanel = useCallback(() => setIsMemoPanelOpen(true), []);
  const closeMemoPanel = useCallback(() => setIsMemoPanelOpen(false), []); // 렌더마다 새 함수가 되면 useVisibleElements의 effect가 매번 다시 돈다.
  const isMemoPanelOverlay = useIsNarrowScreen();
  // todo: React Server Component 사용
  /*
  오류 화면은 보여 줄 트리가 없을 때만 띄운다. isError는 재조회 실패에도 켜지므로, 쓰면 다른 곳의 변경을 확인하다 조회가 실패했을 때 편집기와 입력 중인 초안이 사라진다.
  */
  const {
    data: treeData,
    isLoading,
    isLoadingError: isTreeLoadFailed,
  } = useGetTreeQuery(treeId);

  // Zustand 스토어에서 상태(State) 구독
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);
  const storeTreeId = useTreeStore((state) => state.treeId);

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

  const { fillWorkspaceTree, isFillingWorkspaceTree } = useFillWorkspaceTree({
    workspaceId,
  });

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

  const {
    fitTreeView,
    fitTreeViewAfterNextLayout,
    runAfterNextLayout,
    isLayoutRunning,
  } = useEditorLayout(visibleNodes, visibleEdges, setNodes);

  /*
  계층을 바꾸면 트리 크기가 크게 달라지므로 화면을 다시 맞춘다. 노드별 접기와 달리 보던 지점보다 전체 모양을 보려는 동작이다.
  */
  const {
    treeLevel,
    handleCollapseLevel,
    handleExpandLevel,
    isCollapseLevelDisabled,
    isExpandLevelDisabled,
  } = useTreeLevelControl({
    treeId,
    nodes,
    edges,
    visibleNodes,
    visibleEdges,
    onBeforeLevelChange: fitTreeViewAfterNextLayout,
  });

  const { focusNode, fitNodes, revealNodes } = useFocusNode({
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
  store에는 최종 좌표만 두고, 접힘이 바뀔 때 움직이는 좌표는 화면에 넘기는 노드에만 입힌다.
  전환 중에는 노드를 잡지 못하게 한다. 움직이는 노드를 잡으면 놓일 자리를 잴 기준이 계속 바뀐다.
  */
  const { transitionNodes, transitionEdges, isTransitioning } =
    useNodeTransition({
      nodes: draggableNodes,
      edges: visibleEdges,
      isLayoutRunning,
    });

  /*
  결과로 고른 노드를 선택하고 화면 가운데로 옮긴다. 메모에서 일치한 노드는 일치한 내용을 바로 볼 수 있도록 메모 패널도 연다.
  */
  const handleSelectResult = (result: NodeResult) => {
    focusNode(result.clientId);

    if (result.isMemoMatched) openMemoPanel();
  };

  const isMutating =
    isAddingNode || isDeletingNode || isMovingNode || isUndoingOrRedoing;

  /*
  노드 옆 버튼과 단축키는 우클릭 메뉴와 같은 handler를 부른다. 막힌 동작은 handler의 alert 대신 툴팁으로 이유를 미리 보여 준다.
  */
  const {
    targetClientId: nodeActionTargetClientId,
    blockReasons: nodeActionBlockReasons,
    runNodeAction,
  } = useNodeActions({
    isMutating,
    onOpenMemo: openMemoPanel,
    onAddChild: handleAddNode,
    onDelete: handleDeleteNode,
  });

  /*
  노드 동작 안내가 단계마다 가리킬 툴바 버튼. 안내의 단계 이름표가 동작 ID와 같다.
  툴바가 다른 노드로 옮겨 가 버튼이 다시 붙어도 요소가 같으면 state를 바꾸지 않는다.
  */
  const [nodeActionToolbarElement, setNodeActionToolbarElement] =
    useState<HTMLDivElement | null>(null);
  const [nodeActionButtons, setNodeActionButtons] = useState<
    Partial<Record<NodeActionId, HTMLButtonElement | null>>
  >({});
  const handleNodeActionButtonChange = useCallback(
    (actionId: NodeActionId, element: HTMLButtonElement | null) =>
      setNodeActionButtons((buttons) =>
        buttons[actionId] === element
          ? buttons
          : { ...buttons, [actionId]: element },
      ),
    [],
  );

  const { isPanelOpen, isPanelOverlay, openPanel, closePanel } =
    useResponsivePanelVisibility();

  /*
  닫기 버튼을 누르면 그 버튼이 패널과 함께 사라져 focus가 갈 곳을 잃으므로, 대신 나타나는 열기 버튼으로 옮긴다.
  click 처리 중의 state 변경은 이벤트가 끝날 때 바로 반영되므로 다음 프레임에는 열기 버튼이 있다.
  화면이 좁아져 자동으로 닫힐 때는 사용자가 보던 곳의 focus를 빼앗지 않도록 옮기지 않는다.
  */
  const openPanelButtonRef = useRef<HTMLButtonElement>(null);
  const handleClosePanel = () => {
    closePanel();
    window.requestAnimationFrame(() => openPanelButtonRef.current?.focus());
  };

  /*
  캔버스 빈 곳을 누르면 노드 선택이 풀려 메모 패널이 보여 줄 노드가 없어지므로 화면 폭과 관계없이 닫는다.
  검색 패널은 선택과 관계없이 쓰므로, 좁은 화면에서 캔버스 위에 겹쳐 떴을 때만 닫아 다시 캔버스를 보여 준다.
  */
  const handlePaneClick = () => {
    closeMemoPanel();
    if (isPanelOverlay) closePanel();
  };

  const canvasRef = useRef<HTMLDivElement>(null);

  /*
  단축키 안내는 단축키를 막지 않는 참고 패널이라, 연 채로 노드를 골라 단축키를 써 볼 수 있다.
  */
  const [isShortcutGuideOpen, setIsShortcutGuideOpen] = useState(false);
  const toggleShortcutGuide = useCallback(
    () => setIsShortcutGuideOpen((isOpen) => !isOpen),
    [],
  );
  const closeShortcutGuide = useCallback(
    () => setIsShortcutGuideOpen(false),
    [],
  );

  useNodeActionShortcuts({
    canvasRef,
    targetClientId: nodeActionTargetClientId,
    onRunAction: runNodeAction,
    onToggleGuide: toggleShortcutGuide,
  });
  /*
  강의 중에는 방향키가 강의 이동에 쓰이므로 React Flow의 방향키 노드 이동을 끈다. 켜 두면 선택한 노드가 함께 움직인다.
  강의는 재생 순서가 지금 트리에 맞춰져 있어, 노드 아래 버튼·단축키와 같이 우클릭 메뉴도 열지 않는다.
  */
  const isLectureActive = useIsLectureActive();

  /*
  노드를 고르기 전의 안내는 루트 노드를 가리킨다. 루트는 들어오는 엣지가 없는 노드이고 접어도 숨지 않는다.
  */
  const rootClientId = useTreeStore((state) => {
    const childIds = new Set(state.edges.map((edge) => edge.target));

    return state.nodes.find((node) => !childIds.has(node.id))?.id ?? null;
  });

  const {
    contextMenu,
    handleNodeContextMenu,
    closeContextMenu,
    closeContextMenuAndFocusNode,
  } = useNodeContextMenu({
    containerRef: canvasRef,
    isDisabled: isMutating || isLectureActive,
  });

  const { script: lectureScript, isGenerated: isGeneratedLecture } =
    useLectureScript();
  const [isLectureGeneratorOpen, setIsLectureGeneratorOpen] = useState(false);
  const panelLayoutKey = `${isPanelOpen}:${isPanelOverlay}:${isMemoPanelOpen}:${isLectureGeneratorOpen}`;
  const { handleUserMoveStart } = usePanelCameraAlignment(panelLayoutKey);

  /*
  선택했던 노드가 다른 곳에서 지워지면 그 노드를 가리키던 메모 패널과 우클릭 메뉴가 갈 곳을 잃으므로 닫는다.
  */
  const handleSelectedNodeRemoved = useCallback(() => {
    closeMemoPanel();
    closeContextMenu();
  }, [closeMemoPanel, closeContextMenu]);

  /*
  강의는 재생 순서가 지금 트리의 노드에 맞춰져 있어, 재생 중에는 다른 곳의 변경을 반영하지 않는다.
  */
  useSyncExternalTreeChange({
    treeId,
    isStructureEditing: isMutating || isLectureActive,
    onSelectedNodeRemoved: handleSelectedNodeRemoved,
  });

  /*
  빈 워크스페이스에서 루트를 추가하면 store가 먼저 그 트리로 채워진 뒤 상세 캐시의 treeId가 바뀌어 조회가 시작된다.
  이때 로딩·오류 화면으로 바꾸면 캔버스가 내려갔다 다시 올라와 기본 viewport에서 시작하고, 첫 배치에서 맞춘 화면을 잃는다.
  store가 이미 이 트리를 들고 있으면 편집기를 그대로 둔다. 조회 결과는 useInitializeTree가 같은 트리로 보고 건너뛴다.
  */
  const isTreeInStore = treeId !== null && storeTreeId === treeId;
  const hasLeftPanelOffset = isPanelOpen && !isPanelOverlay;
  const hasRightPanelOffset =
    isMemoPanelOpen && treeId !== null && !isMemoPanelOverlay;

  if (isLoading && !isTreeInStore) {
    return <div>불러오는 중입니다.</div>;
  }

  if (isTreeLoadFailed && !isTreeInStore) {
    return <div>트리를 불러오지 못했습니다.</div>;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full">
      <WorkspacePanel
        onSelectResult={handleSelectResult}
        isResultSelectDisabled={isMutating}
        onFitNodes={fitNodes}
        isOpen={isPanelOpen}
        isOverlay={isPanelOverlay}
        onClose={handleClosePanel}
      />

      <div
        ref={canvasRef}
        className="@container relative min-h-0 min-w-0 flex-1"
      >
        <ReactFlow
          nodes={transitionNodes}
          edges={transitionEdges}
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
          onMoveStart={(event) => {
            closeContextMenu();
            handleUserMoveStart(event);
          }}
          onPaneClick={handlePaneClick}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          /*
          React Flow의 기본 삭제 키(Backspace)는 서버 요청 없이 화면에서만 노드를 지운다. 삭제 키는
          useNodeActionShortcuts가 받아 우클릭 메뉴·노드 아래 버튼과 같은 handleDeleteNode에 잇는다.
          */
          deleteKeyCode={null}
          disableKeyboardA11y={isMutating || isLectureActive}
          /*
          disableKeyboardA11y는 선택 키를 끄지 않는다. Shift + 방향키로 장면을 옮기는 동안 영역 선택 모드가 켜지지 않게 한다.
          */
          selectionKeyCode={isLectureActive ? null : undefined}
          multiSelectionKeyCode={isLectureActive ? null : undefined}
          nodesDraggable={!isMutating && !isTransitioning}
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

          {nodeActionTargetClientId !== null ? (
            <NodeActionToolbar
              clientId={nodeActionTargetClientId}
              blockReasons={nodeActionBlockReasons}
              onRunAction={runNodeAction}
              toolbarRef={setNodeActionToolbarElement}
              onActionButtonChange={handleNodeActionButtonChange}
            />
          ) : null}

          {/*
          노드를 고르면 고르기 전 안내는 할 일을 마친 것이라 닫은 것으로 기록하고, 선택 툴바 안내로 넘어간다.
          강의 중에는 노드 동작을 쓸 수 없어 둘 다 숨긴다. 선택 툴바 대상은 강의 중 이미 null이다.

          루트 안내는 NodeToolbar의 기준점만 노드를 따라가고 실제 카드는 캔버스 안으로 보정한다.
          고른 뒤 안내는 툴바 아래에 띄우고 꼬리로 툴바 버튼을 하나씩 가리킨다. 선택을 풀면 숨고, 다시 고르면 처음부터 보인다.
          */}
          <CanvasOnboardingHint
            scenarioId="canvas-root-node"
            nodeId={rootClientId}
            isReached={nodeActionTargetClientId === null && !isLectureActive}
            placement="bottom"
            align="start"
            isCompleted={nodeActionTargetClientId !== null}
          />
          <CanvasOnboardingTour
            scenarioId="canvas-node-actions"
            isReached={nodeActionTargetClientId !== null}
            anchor={nodeActionToolbarElement}
            targets={nodeActionButtons}
          />

          {isPanelOpen ? null : (
            <Panel position="top-left">
              <WorkspacePanelOpenButton
                ref={openPanelButtonRef}
                onOpen={openPanel}
              />
            </Panel>
          )}

          <Panel
            position="top-right"
            className={hasRightPanelOffset ? "!right-[360px]" : undefined}
          >
            <EditorToolbar
              onUndo={handleUndo}
              onRedo={handleRedo}
              onFitView={fitTreeView}
              treeLevel={treeLevel}
              onCollapseLevel={handleCollapseLevel}
              onExpandLevel={handleExpandLevel}
              isCollapseLevelDisabled={isCollapseLevelDisabled}
              isExpandLevelDisabled={isExpandLevelDisabled}
              isUndoDisabled={!canUndo || isMutating}
              isRedoDisabled={!canRedo || isMutating}
            />
          </Panel>

          {/*
          지금 트리에서 만든 강의를, 없으면 트리에 맞는 데모 대본을 재생한다. 서버가 강의를 저장하게 되면 조회 결과로 바꾼다.
          노드가 없으면 강의로 설명할 대상이 없으므로 그리지 않는다. 빈 트리 안내가 그 자리의 시작점을 맡는다.
          */}
          {nodes.length === 0 ? null : (
            <Panel
              position="bottom-center"
              style={{
                left: hasLeftPanelOffset ? 256 : 0,
                right: hasRightPanelOffset ? 360 : 0,
              }}
              className="!pointer-events-none !translate-x-0 mx-auto flex w-auto max-w-2xl justify-center px-4"
            >
              <LecturePlayer
                script={lectureScript}
                isGeneratedScript={isGeneratedLecture}
                onRevealNodes={revealNodes}
                onResetCamera={fitTreeView}
                onBeforeCollapseRestore={fitTreeViewAfterNextLayout}
                panelLayoutKey={panelLayoutKey}
                onGeneratorOpenChange={setIsLectureGeneratorOpen}
              />
            </Panel>
          )}
        </ReactFlow>

        {/*
        노드가 없으면 우클릭할 노드도 없어 트리를 시작할 방법이 보이지 않으므로 캔버스 가운데에 안내를 둔다.
        트리 조회가 끝난 뒤에만 여기까지 오므로, 트리가 없거나 루트 생성이 실패해 노드가 없는 경우가 모두 해당한다.
        바깥은 pointer 이벤트를 꺼서 안내 주변의 캔버스 이동을 막지 않는다.
        */}
        {nodes.length === 0 ? (
          <div
            style={{
              left: hasLeftPanelOffset ? 256 : 0,
              right: hasRightPanelOffset ? 360 : 0,
            }}
            className="pointer-events-none absolute inset-y-0 z-10 flex items-center justify-center overflow-y-auto p-4"
          >
            <div className="pointer-events-auto w-full max-w-xl">
              {/*
              AI 생성은 1분 넘게 걸릴 수 있어, 그동안 직접 추가를 막아 두 요청이 같은 빈 트리를 채우려 다투지 않게 한다.
              첨부는 하나까지만 받으므로 첫 항목의 원본 파일을 넘긴다. 대시보드와 같다.
              */}
              <EmptyTreeGuide
                onAddRootNode={handleAddNode}
                isAddRootNodeDisabled={
                  !isAddNodeEnabled || isMutating || isFillingWorkspaceTree
                }
                aiFillSlot={
                  <>
                    {isFillingWorkspaceTree ? <TreeCreatingNotice /> : null}
                    <PromptComposer
                      placeholder="주제를 적거나 파일을 첨부하세요. 예: 재생 에너지 연구"
                      isSubmitting={isFillingWorkspaceTree || isMutating}
                      onSubmit={(draft) =>
                        fillWorkspaceTree(
                          draft.text,
                          draft.attachments[0]?.file,
                        )
                      }
                    />
                  </>
                }
              />
            </div>
          </div>
        ) : null}

        {isShortcutGuideOpen ? (
          <ShortcutGuide onClose={closeShortcutGuide} />
        ) : null}

        {/*
        메뉴는 우클릭한 노드를 대상으로 한다. 메뉴를 열 때 그 노드만 선택해 두므로 노드 아래 버튼과 같은 useNodeActions의 대상이 된다.
        강의가 시작되는 등 대상이 바뀌면 메뉴 항목이 다른 노드에 실행되지 않도록 메뉴를 그리지 않는다.
        */}
        {contextMenu && contextMenu.clientId === nodeActionTargetClientId ? (
          <NodeContextMenu
            key={contextMenu.clientId}
            x={contextMenu.x}
            y={contextMenu.y}
            blockReasons={nodeActionBlockReasons}
            onRunAction={runNodeAction}
            onClose={closeContextMenu}
            onEscape={closeContextMenuAndFocusNode}
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
      <WorkspaceHeader workspace={workspace} isNameLoading={isPending} />

      <div className="min-h-0 flex-1">
        {isPending ? (
          <div>불러오는 중입니다.</div>
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
