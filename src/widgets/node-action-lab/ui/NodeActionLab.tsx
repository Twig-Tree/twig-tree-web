"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  type CustomEditorNode,
  MIN_ZOOM,
  edgeTypes,
  nodeTypes,
  useEditorLayout,
  useInitializeTree,
  useNodeContextMenu,
  useNodeTransition,
  useReactFlowStoreSetters,
  useTreeStore,
  useVisibleElements,
} from "@/src/features/tree-editor";
import {
  DEFAULT_NODE_ACTION_LAB_CONFIG,
  getToolbarEntryKey,
  type MenuEntry,
  TOOLBAR_ENTRY_KEY_OPTIONS,
  type NodeActionLabConfig,
} from "../model/config";
import {
  NODE_ACTION_LAB_TREE,
  NODE_ACTION_LAB_TREE_ID,
} from "../model/fixtureTree";
import { getToolbarTargets } from "../model/getToolbarTargets";
import { getNodeActionShortcuts } from "../model/shortcuts";
import { useDevicePlatform } from "../model/useDevicePlatform";
import { useHoveredNode } from "../model/useHoveredNode";
import { useLabNodeActions } from "../model/useLabNodeActions";
import { useLabShortcuts } from "../model/useLabShortcuts";
import { LabActionLog } from "./LabActionLog";
import { LabActionMenu } from "./LabActionMenu";
import { LabHintBar } from "./LabHintBar";
import { LabMemoPanel } from "./LabMemoPanel";
import { LabNodeToolbar } from "./LabNodeToolbar";
import { LabShortcutGuide } from "./LabShortcutGuide";
import { LabRenameInput } from "./LabRenameInput";
import { LabSettingsPanel } from "./LabSettingsPanel";

const handleSelectedNodeHidden = () => {}; // 렌더마다 새 함수가 되면 useVisibleElements의 effect가 매번 다시 돈다

/*
함수 이름 : NodeActionLabCanvas
기능 : 서버 없이 고정 트리를 실제 편집기의 노드·연결선으로 그리고, 고른 진입 방식으로 노드 동작을 실행해 본다.
인자 : 없음
반환값 : 진입 방식 설정, 실행 기록, 트리 캔버스, 메모 패널

제품과 같은 노드를 그려야 메뉴·버튼·입력창이 노드를 가리는지 실제 모습으로 볼 수 있으므로 실험용 노드를 따로 만들지 않는다.
*/
function NodeActionLabCanvas() {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);
  const onNodesChange = useTreeStore((state) => state.onNodesChange);
  const onEdgesChange = useTreeStore((state) => state.onEdgesChange);
  const { setNodes } = useReactFlowStoreSetters();

  const [config, setConfig] = useState<NodeActionLabConfig>(
    DEFAULT_NODE_ACTION_LAB_CONFIG,
  );

  /*
  트리를 처음 상태로 되돌리면 회차를 올린다. 트리 ID가 바뀌어야 useInitializeTree가 store를 다시 채운다.
  */
  const [treeRevision, setTreeRevision] = useState(0);
  const treeId = `${NODE_ACTION_LAB_TREE_ID}:${treeRevision}`;

  useInitializeTree({ treeId, treeData: NODE_ACTION_LAB_TREE });

  const { visibleNodes, visibleEdges } = useVisibleElements({
    nodes,
    edges,
    onSelectedNodeHidden: handleSelectedNodeHidden,
  });
  const { fitTreeViewAfterNextLayout, isLayoutRunning } = useEditorLayout(
    visibleNodes,
    visibleEdges,
    setNodes,
  );
  const { transitionNodes, transitionEdges } = useNodeTransition({
    nodes: visibleNodes,
    edges: visibleEdges,
    isLayoutRunning,
  });

  /*
  useEditorLayout은 처음 그릴 때만 화면을 맞춘다. 트리를 되돌리면 새 트리의 레이아웃이 끝난 뒤 다시 맞춘다.
  store의 treeId를 보는 이유는 새 노드의 레이아웃 계산이 시작된 뒤에 예약해야 이전 계산이 예약을 가져가지 않기 때문이다.
  */
  const storeTreeId = useTreeStore((state) => state.treeId);
  const previousStoreTreeIdRef = useRef(storeTreeId);

  useEffect(() => {
    const previousTreeId = previousStoreTreeIdRef.current;
    previousStoreTreeIdRef.current = storeTreeId;

    if (previousTreeId === null || storeTreeId === previousTreeId) return;

    fitTreeViewAfterNextLayout();
  }, [storeTreeId, fitTreeViewAfterNextLayout]);

  const {
    runAction,
    getBlockReason,
    memoClientId,
    closeMemo,
    renamingClientId,
    commitRename,
    cancelRename,
    closeOverlays,
    log,
    clearLog,
  } = useLabNodeActions(treeId);

  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    contextMenu,
    handleNodeContextMenu,
    closeContextMenu,
    closeContextMenuAndFocusNode,
  } = useNodeContextMenu({ containerRef: canvasRef, isDisabled: false });

  /*
  메뉴를 연 방법을 열 때 기억해 둔다. 메뉴가 열린 사이에 설정을 바꿔도 실행 기록에는 실제로 연 방법이 남는다.
  */
  const [menuEntry, setMenuEntry] = useState<MenuEntry>("contextMenu");

  const openMenu = (
    entry: MenuEntry,
    event: MouseEvent,
    node: CustomEditorNode,
  ) => {
    setMenuEntry(entry);
    handleNodeContextMenu(event, node);
  };

  /*
  노드를 누르면 React Flow가 먼저 선택을 옮기고 이 handler를 부른다. 넘어오는 node는 누르기 전 값이라
  selected로 이미 선택된 노드를 다시 눌렀는지 알 수 있다. 접기 버튼은 클릭 전파를 막아 여기까지 오지 않는다.
  */
  const handleNodeClick = (event: MouseEvent, node: CustomEditorNode) => {
    const { menuTrigger } = config;

    if (menuTrigger === "click") openMenu("click", event, node);
    if (menuTrigger === "clickSelected" && node.selected) {
      openMenu("clickSelected", event, node);
    }
  };

  const memoNode = nodes.find((node) => node.id === memoClientId);
  const renamingNode = nodes.find((node) => node.id === renamingClientId);

  const { hoveredClientId, enterNode, leaveNode, enterToolbar, leaveToolbar } =
    useHoveredNode();
  const selectedNodes = nodes.filter((node) => node.selected);
  const toolbarTargets = getToolbarTargets({
    visibility: config.toolbarVisibility,
    hoveredClientId,
    selectedClientId: selectedNodes.length === 1 ? selectedNodes[0].id : null, // 여러 노드에 같은 동작을 실행하는 일은 다루지 않는다
    renamingClientId,
  });

  const devicePlatform = useDevicePlatform();
  const platform =
    config.shortcutPlatform === "auto"
      ? devicePlatform
      : config.shortcutPlatform;
  const shortcuts = getNodeActionShortcuts(platform, config.macMemoKey);

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const toolbarEntryKey = getToolbarEntryKey(config);

  useLabShortcuts({
    shortcutsEnabled: config.shortcutsEnabled,
    guideEnabled: config.showShortcutGuide,
    toolbarEntryKey,
    shortcuts,
    canvasRef,
    onRunAction: (actionId, clientId) =>
      runAction(actionId, "shortcut", clientId),
    onToggleGuide: () => setIsGuideOpen((isOpen) => !isOpen),
  });

  const handleResetTree = () => {
    closeContextMenu();
    closeOverlays();
    setTreeRevision((revision) => revision + 1);
  };

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside
        aria-label="노드 동작 실험 도구"
        className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-surface-muted p-4"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-content">Node Action Lab</h2>
          <p className="text-xs text-content-muted">
            동작은 서버 없이 이 화면에서만 실행됩니다. 노드를 더블클릭하면 제품
            편집기가 열리지만 저장은 실패합니다.
          </p>
        </div>

        <LabSettingsPanel
          config={config}
          platform={platform}
          onChangeConfig={(patch) =>
            setConfig((previous) => ({ ...previous, ...patch }))
          }
        />

        <button
          type="button"
          onClick={handleResetTree}
          className="h-8 rounded-control border border-line bg-surface text-xs font-bold text-content-secondary hover:bg-surface-hover"
        >
          트리 처음 상태로
        </button>

        <LabActionLog log={log} onClear={clearLog} />
      </aside>

      <div ref={canvasRef} className="relative min-h-0 min-w-0 flex-1">
        <ReactFlow
          nodes={transitionNodes}
          edges={transitionEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={MIN_ZOOM}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeContextMenu={
            config.menuTrigger === "contextMenu"
              ? (event, node) => openMenu("contextMenu", event, node)
              : undefined
          }
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={(_, node) => enterNode(node.id)}
          onNodeMouseLeave={leaveNode}
          onMoveStart={closeContextMenu}
          deleteKeyCode={null}
          /*
          노드를 끌어 옮기는 제품 동작은 서버 저장을 거쳐 실험실에서 재현하지 않는다. 클릭 메뉴가 끌기와 부딪히는지는 제품에 넣을 때 함께 본다.
          */
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={0.8}
            bgColor="transparent"
          />
          {toolbarTargets.map((target) => (
            <LabNodeToolbar
              key={target.clientId}
              target={target}
              position={config.toolbarPosition}
              buttonStyle={config.toolbarStyle}
              tooltip={config.tooltip}
              shortcuts={shortcuts}
              getBlockReason={(actionId) =>
                getBlockReason(actionId, target.clientId)
              }
              onRunAction={(actionId) =>
                runAction(actionId, target.entry, target.clientId)
              }
              onMouseEnter={enterToolbar}
              onMouseLeave={leaveToolbar}
            />
          ))}
          {renamingNode ? (
            <LabRenameInput
              key={renamingNode.id}
              clientId={renamingNode.id}
              initialName={renamingNode.data.label}
              onCommit={(name) => commitRename(renamingNode.id, name)}
              onCancel={cancelRename}
            />
          ) : null}
        </ReactFlow>

        {contextMenu ? (
          <LabActionMenu
            key={contextMenu.clientId}
            x={contextMenu.x}
            y={contextMenu.y}
            getBlockReason={(actionId) =>
              getBlockReason(actionId, contextMenu.clientId)
            }
            shortcuts={config.showMenuShortcuts ? shortcuts : null}
            onSelect={(actionId) =>
              runAction(actionId, menuEntry, contextMenu.clientId)
            }
            onClose={closeContextMenu}
            onEscape={closeContextMenuAndFocusNode}
          />
        ) : null}

        {config.showHintBar && selectedNodes.length === 1 && !renamingNode ? (
          <LabHintBar
            shortcuts={config.shortcutsEnabled ? shortcuts : null}
            toolbarEntryLabel={
              TOOLBAR_ENTRY_KEY_OPTIONS.find(
                (option) => option.value === toolbarEntryKey,
              )?.label ?? null
            }
            getBlockReason={(actionId) =>
              getBlockReason(actionId, selectedNodes[0].id)
            }
            showGuideHint={config.showShortcutGuide}
          />
        ) : null}

        {config.showShortcutGuide && isGuideOpen ? (
          <LabShortcutGuide
            shortcuts={shortcuts}
            platform={platform}
            onClose={() => setIsGuideOpen(false)}
          />
        ) : null}
      </div>

      {memoNode ? (
        <LabMemoPanel
          nodeLabel={memoNode.data.label}
          memo={memoNode.data.memo}
          onClose={closeMemo}
        />
      ) : null}
    </div>
  );
}

/*
함수 이름 : NodeActionLab
기능 : 노드 동작을 찾고 실행하는 방식을 비교하는 개발 전용 화면을 그린다.
인자 : 없음
반환값 : React Flow 문맥을 갖춘 노드 동작 실험실
*/
export function NodeActionLab() {
  return (
    <ReactFlowProvider>
      <NodeActionLabCanvas />
    </ReactFlowProvider>
  );
}
