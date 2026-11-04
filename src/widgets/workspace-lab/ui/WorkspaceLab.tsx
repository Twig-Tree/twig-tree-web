"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Background,
  Panel,
  ReactFlow,
  type EdgeTypes,
  type NodeTypes,
  type OnNodesChange,
} from "@xyflow/react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Maximize2,
  MoreHorizontal,
  Play,
  Plus,
  Redo2,
  Search,
  Share2,
  Undo2,
  X,
} from "lucide-react";
import {
  getWorkspaceLabLayout,
  getWorkspaceLabLayoutSpacing,
  type WorkspaceLabLayoutNodeSizes,
} from "../model/layouts";
import {
  getWorkspaceLabEdgeColor,
  getWorkspaceLabEdgeThickness,
} from "../model/edge-styles";
import { getWorkspaceLabColorTokens } from "../model/color-roles";
import {
  workspaceLabConfigReducer,
  workspaceLabDefaultConfig,
  type WorkspaceLabConfig,
} from "../model/config";
import { getWorkspaceLabScenario } from "../model/scenarios";
import {
  getWorkspaceLabShapeCssStyle,
  getWorkspaceLabShapeStyle,
} from "../model/shape-styles";
import {
  getWorkspaceLabColorTheme,
  getWorkspaceLabColorThemeStyle,
} from "../model/color-themes";
import {
  getWorkspaceLabPanelStyle,
  type WorkspaceLabPanelKind,
} from "../model/panels";
import {
  getWorkspaceLabCanvasStyle,
  getWorkspaceLabNodeDensity,
  getWorkspaceLabNodeDensityStyle,
  getWorkspaceLabNodeSize,
} from "../model/visual-slots";
import type {
  LabPanelStyle,
  WorkspaceLabEdge,
  WorkspaceLabNode,
} from "../model/types";
import { WorkspaceLabEdge as WorkspaceLabEdgeView } from "./WorkspaceLabEdge";
import { WorkspaceLabInspector } from "./WorkspaceLabInspector";
import { WorkspaceLabNode as WorkspaceLabNodeView } from "./WorkspaceLabNode";
import styles from "./WorkspaceLab.module.css";

const nodeTypes: NodeTypes = { workspaceLab: WorkspaceLabNodeView };
const edgeTypes: EdgeTypes = { workspaceLab: WorkspaceLabEdgeView };
const emptyNodeSizes: WorkspaceLabLayoutNodeSizes = new Map();

function useWorkspaceLabNodeMeasurements() {
  const [nodeSizes, setNodeSizes] =
    useState<WorkspaceLabLayoutNodeSizes>(emptyNodeSizes);
  const pendingSizesRef = useRef(
    new Map<string, { width: number; height: number }>(),
  );
  const animationFrameRef = useRef<number | null>(null);

  const flushMeasurements = useCallback(() => {
    animationFrameRef.current = null;
    const pendingSizes = new Map(pendingSizesRef.current);
    pendingSizesRef.current.clear();

    setNodeSizes((currentSizes) => {
      const nextSizes = new Map(currentSizes);
      let changed = false;

      for (const [id, size] of pendingSizes) {
        const previous = currentSizes.get(id);
        if (
          previous &&
          Math.abs(previous.width - size.width) < 0.5 &&
          Math.abs(previous.height - size.height) < 0.5
        ) {
          continue;
        }

        nextSizes.set(id, size);
        changed = true;
      }

      return changed ? nextSizes : currentSizes;
    });
  }, []);

  const onNodesChange = useCallback<OnNodesChange<WorkspaceLabNode>>(
    (changes) => {
      for (const change of changes) {
        if (
          change.type !== "dimensions" ||
          !change.dimensions ||
          change.dimensions.width <= 0 ||
          change.dimensions.height <= 0
        ) {
          continue;
        }

        pendingSizesRef.current.set(change.id, change.dimensions);
      }

      if (
        pendingSizesRef.current.size > 0 &&
        animationFrameRef.current === null
      ) {
        animationFrameRef.current = requestAnimationFrame(flushMeasurements);
      }
    },
    [flushMeasurements],
  );

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  return { nodeSizes, onNodesChange };
}

function getPreviewPanelAttributes(
  kind: WorkspaceLabPanelKind,
  panelStyle: LabPanelStyle,
) {
  return {
    "data-placement": panelStyle.placement,
    "data-surface": panelStyle.surface,
    "data-border": panelStyle.border,
    style: getWorkspaceLabPanelStyle(kind, panelStyle),
  };
}

function PreviewLeftPanel({ panelStyle }: { panelStyle: LabPanelStyle }) {
  return (
    <aside
      className="workspace-preview-panel workspace-preview-sidebar flex shrink-0 flex-col border-r"
      {...getPreviewPanelAttributes("sidebar", panelStyle)}
    >
      <div className="workspace-preview-panel-section border-b">
        <label className="workspace-preview-search flex h-9 items-center gap-2 rounded-lg border px-3">
          <Search className="size-3.5" aria-hidden="true" />
          <span>노드 검색</span>
        </label>
      </div>
      <div className="workspace-preview-panel-section min-h-0 flex-1">
        <p className="workspace-preview-eyebrow text-[10px] font-semibold tracking-wider uppercase">
          Outline
        </p>
        <ul className="mt-3 space-y-1">
          {["사용자 리서치", "정보 구조", "비주얼 시스템"].map((label) => (
            <li
              key={label}
              className="workspace-preview-outline-item flex items-center gap-1.5 rounded-md px-2"
            >
              <ChevronRight className="size-3 opacity-60" /> {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="workspace-preview-panel-section border-t">
        <p className="workspace-preview-eyebrow text-[10px] font-semibold tracking-wider uppercase">
          Tags
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["핵심", "검토 필요", "완료"].map((tag) => (
            <span
              key={tag}
              className="workspace-preview-tag rounded-full px-2 py-1 text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function PreviewMemoPanel({ panelStyle }: { panelStyle: LabPanelStyle }) {
  return (
    <aside
      className="workspace-preview-panel workspace-preview-memo flex shrink-0 flex-col border-l"
      {...getPreviewPanelAttributes("memo", panelStyle)}
    >
      <header className="workspace-preview-panel-section flex items-center justify-between border-b">
        <div>
          <p className="workspace-preview-accent-label text-[9px] font-semibold tracking-wider uppercase">
            Memo
          </p>
          <p className="workspace-preview-title mt-0.5 text-sm font-semibold">
            정보 구조
          </p>
        </div>
        <button className="workspace-preview-icon-button grid size-7 place-items-center rounded-md">
          <X className="size-3.5" />
          <span className="sr-only">메모 패널 닫기</span>
        </button>
      </header>
      <div className="workspace-preview-panel-section flex-1">
        <div className="workspace-preview-memo-body h-full rounded-lg border p-3 leading-5">
          선택한 노드의 메모와 태그가 표시되는 영역입니다. 패널의 폭과 정보
          밀도를 함께 검토할 수 있습니다.
        </div>
      </div>
      <footer className="workspace-preview-panel-section flex justify-end gap-2 border-t">
        <button className="workspace-preview-secondary-button rounded-md border px-3 py-1.5 text-xs">
          되돌리기
        </button>
        <button className="workspace-preview-primary-button rounded-md px-3 py-1.5 text-xs font-medium">
          저장
        </button>
      </footer>
    </aside>
  );
}

function PreviewToolbar() {
  const items = [
    { label: "실행 취소", icon: Undo2 },
    { label: "다시 실행", icon: Redo2 },
    { label: "화면 맞춤", icon: Maximize2 },
    { label: "노드 추가", icon: Plus },
    { label: "더보기", icon: MoreHorizontal },
  ];

  return (
    <div className="workspace-preview-toolbar flex items-center gap-1 rounded-xl border p-1.5 backdrop-blur">
      {items.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="workspace-preview-toolbar-button grid size-8 place-items-center rounded-lg"
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function PreviewPlayer() {
  return (
    <div className="workspace-preview-player flex min-w-72 items-center gap-3 rounded-xl border px-3 py-2 backdrop-blur">
      <button className="workspace-preview-player-button grid size-8 place-items-center rounded-full">
        <Play className="ml-0.5 size-3.5 fill-current" />
        <span className="sr-only">강의 재생</span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="workspace-preview-meta flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" /> 디자인 기초
          </span>
          <span>01:24 / 04:30</span>
        </div>
        <div className="workspace-preview-progress mt-1.5 h-1 overflow-hidden rounded-full">
          <div className="workspace-preview-progress-bar h-full w-[32%] rounded-full" />
        </div>
      </div>
    </div>
  );
}

function WorkspacePreview({ config }: { config: WorkspaceLabConfig }) {
  const {
    nodeState,
    edgeState,
    edgeStyle,
    layoutMode,
    layoutSpacing,
    nodeShape,
    connectionPointStyle,
    collapseControlStyle,
    canvasStyle,
    density,
    viewport,
    showLeftPanel,
    showRightPanel,
    showToolbar,
    showPlayer,
    leftPanelStyle,
    memoPanelStyle,
  } = config;
  const scenario = getWorkspaceLabScenario(config.scenarioId);
  const activeLayoutSpacing = getWorkspaceLabLayoutSpacing(layoutSpacing);
  const activeNodeDensity = getWorkspaceLabNodeDensity(density);
  const fallbackNodeSize = useMemo(
    () => getWorkspaceLabNodeSize(activeNodeDensity, nodeShape),
    [activeNodeDensity, nodeShape],
  );
  const { nodeSizes, onNodesChange } = useWorkspaceLabNodeMeasurements();
  const laidOutScenario = useMemo(
    () =>
      getWorkspaceLabLayout(layoutMode).calculate({
        scenario,
        spacing: activeLayoutSpacing,
        fallbackNodeSize,
        nodeSizes,
      }),
    [activeLayoutSpacing, fallbackNodeSize, layoutMode, nodeSizes, scenario],
  );
  const activeCanvasStyle = getWorkspaceLabCanvasStyle(canvasStyle);
  const activeEdgeColor = getWorkspaceLabEdgeColor(edgeStyle.color);
  const activeEdgeThickness = getWorkspaceLabEdgeThickness(edgeStyle.thickness);
  const nodes = useMemo<WorkspaceLabNode[]>(
    () =>
      laidOutScenario.nodes.map((item, index) => ({
        ...item,
        style: {
          ...item.style,
          ...(nodeShape === "circle"
            ? {
                width: activeNodeDensity.circleSize,
                minWidth: activeNodeDensity.circleSize,
                maxWidth: activeNodeDensity.circleSize,
              }
            : {}),
        },
        selected: index === 0 && nodeState === "selected",
        data: {
          ...item.data,
          state: index === 0 ? nodeState : "default",
          nodeShape,
          connectionPointStyle,
          collapseControlStyle,
        },
      })),
    [
      activeNodeDensity.circleSize,
      collapseControlStyle,
      connectionPointStyle,
      laidOutScenario.nodes,
      nodeShape,
      nodeState,
    ],
  );
  const edges = useMemo<WorkspaceLabEdge[]>(
    () =>
      laidOutScenario.edges.map((item, index) => ({
        ...item,
        markerEnd:
          typeof item.markerEnd === "object" && item.markerEnd
            ? {
                ...item.markerEnd,
                color:
                  index === 0 && edgeState === "active"
                    ? "var(--lab-accent)"
                    : index === 0 && edgeState === "traced"
                      ? "var(--lab-lecture)"
                      : activeEdgeColor.value,
                strokeWidth: activeEdgeThickness.width,
              }
            : item.markerEnd,
        data: {
          ...item.data,
          state: index === 0 ? edgeState : "default",
          ...edgeStyle,
        },
      })),
    [
      activeEdgeColor.value,
      activeEdgeThickness.width,
      edgeState,
      edgeStyle,
      laidOutScenario.edges,
    ],
  );

  return (
    <div className={`${styles.preview} min-h-0 flex-1 overflow-auto p-4`}>
      <section
        className={`${styles.previewFrame} mx-auto flex h-full min-h-[560px] w-full overflow-hidden`}
        data-viewport={viewport}
        aria-label="워크스페이스 UI 미리보기"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="workspace-preview-header flex h-12 shrink-0 items-center justify-between border-b px-4">
            <div>
              <p className="workspace-preview-eyebrow text-[9px] font-medium tracking-wider uppercase">
                Workspace
              </p>
              <h1 className="workspace-preview-title text-sm font-semibold">
                디지털 제품 디자인
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="workspace-preview-saved flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium">
                <Check className="size-3" aria-hidden="true" /> Saved
              </span>
              <span className="workspace-preview-avatar grid size-7 place-items-center rounded-full text-[9px] font-semibold">
                SF
              </span>
              <button
                type="button"
                className="workspace-preview-share flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-medium"
              >
                <Share2 className="size-3" aria-hidden="true" /> 공유
              </button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1">
            {showLeftPanel ? (
              <PreviewLeftPanel panelStyle={leftPanelStyle} />
            ) : null}

            <div
              className={`${styles.canvas} relative min-h-0 min-w-0 flex-1`}
              data-canvas={canvasStyle}
            >
              {scenario.nodes.length === 0 ? (
                <div className="absolute inset-0 z-10 grid place-items-center pointer-events-none">
                  <div className="workspace-preview-empty rounded-2xl border border-dashed px-8 py-7 text-center backdrop-blur">
                    <div className="workspace-preview-empty-icon mx-auto grid size-10 place-items-center rounded-full">
                      <Plus className="size-5" />
                    </div>
                    <p className="workspace-preview-title mt-3 text-sm font-semibold">
                      첫 번째 노드를 추가하세요
                    </p>
                    <p className="workspace-preview-meta mt-1 text-xs">
                      아이디어의 시작점을 만들어 트리를 확장할 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : null}

              <ReactFlow
                key={`${scenario.id}-${layoutMode}-${layoutSpacing}-${nodeShape}-${density}-${connectionPointStyle}-${collapseControlStyle}-${canvasStyle}`}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag
                zoomOnScroll
                proOptions={{ hideAttribution: true }}
              >
                {activeCanvasStyle.backgrounds?.map((background, index) => (
                  <Background
                    key={index}
                    id={`workspace-lab-canvas-${index}`}
                    {...background}
                  />
                ))}
                {showToolbar ? (
                  <Panel position="top-center">
                    <PreviewToolbar />
                  </Panel>
                ) : null}
                {showPlayer ? (
                  <Panel position="bottom-center">
                    <PreviewPlayer />
                  </Panel>
                ) : null}
              </ReactFlow>
            </div>

            {showRightPanel ? (
              <PreviewMemoPanel panelStyle={memoPanelStyle} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export function WorkspaceLab() {
  const [config, changeConfig] = useReducer(
    workspaceLabConfigReducer,
    workspaceLabDefaultConfig,
  );
  const activeTheme = getWorkspaceLabColorTheme(config.colorTheme);
  const activeThemeTokens = useMemo(
    () => getWorkspaceLabColorTokens(activeTheme.tokens, config.colorRoles),
    [activeTheme, config.colorRoles],
  );
  const activeNodeDensity = getWorkspaceLabNodeDensity(config.density);

  return (
    <main
      className={`${styles.lab} flex h-full min-h-0 w-full bg-slate-100`}
      data-color-theme={config.colorTheme}
      data-density={config.density}
      style={{
        ...getWorkspaceLabColorThemeStyle({
          ...activeTheme,
          tokens: activeThemeTokens,
        }),
        ...getWorkspaceLabShapeCssStyle(
          getWorkspaceLabShapeStyle(config.shapeStyle),
        ),
        ...getWorkspaceLabNodeDensityStyle(activeNodeDensity),
      }}
    >
      <WorkspacePreview config={config} />
      <WorkspaceLabInspector config={config} onChange={changeConfig} />
    </main>
  );
}
