"use client";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import {
  BookOpen,
  ChevronRight,
  Maximize2,
  MoreHorizontal,
  Play,
  Plus,
  Redo2,
  Search,
  Undo2,
  X,
} from "lucide-react";
import { workspaceLabScenarios } from "../model/scenarios";
import type {
  LabDensity,
  LabEdgeState,
  LabNodeState,
  LabTheme,
  LabViewport,
  WorkspaceLabEdge,
  WorkspaceLabNode,
  WorkspaceLabScenario,
} from "../model/types";
import { WorkspaceLabEdge as WorkspaceLabEdgeView } from "./WorkspaceLabEdge";
import { WorkspaceLabInspector } from "./WorkspaceLabInspector";
import { WorkspaceLabNode as WorkspaceLabNodeView } from "./WorkspaceLabNode";
import styles from "./WorkspaceLab.module.css";

const nodeTypes: NodeTypes = { workspaceLab: WorkspaceLabNodeView };
const edgeTypes: EdgeTypes = { workspaceLab: WorkspaceLabEdgeView };

function PreviewLeftPanel() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-3">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400">
          <Search className="size-3.5" aria-hidden="true" />
          <span>노드 검색</span>
        </label>
      </div>
      <div className="min-h-0 flex-1 p-3">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Outline
        </p>
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {["사용자 리서치", "정보 구조", "비주얼 시스템"].map((label) => (
            <li
              key={label}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-slate-50"
            >
              <ChevronRight className="size-3 text-slate-400" /> {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-slate-100 p-3">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Tags
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["핵심", "검토 필요", "완료"].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function PreviewMemoPanel() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
      <header className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
        <div>
          <p className="text-[9px] font-semibold tracking-wider text-indigo-500 uppercase">
            Memo
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            정보 구조
          </p>
        </div>
        <button className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100">
          <X className="size-3.5" />
          <span className="sr-only">메모 패널 닫기</span>
        </button>
      </header>
      <div className="flex-1 p-4">
        <div className="h-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          선택한 노드의 메모와 태그가 표시되는 영역입니다. 패널의 폭과 정보
          밀도를 함께 검토할 수 있습니다.
        </div>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-100 p-3">
        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600">
          되돌리기
        </button>
        <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
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
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      {items.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function PreviewPlayer() {
  return (
    <div className="flex min-w-72 items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <button className="grid size-8 place-items-center rounded-full bg-indigo-600 text-white">
        <Play className="ml-0.5 size-3.5 fill-current" />
        <span className="sr-only">강의 재생</span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" /> 디자인 기초
          </span>
          <span>01:24 / 04:30</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[32%] rounded-full bg-indigo-500" />
        </div>
      </div>
    </div>
  );
}

function WorkspacePreview({
  scenario,
  nodeState,
  edgeState,
  viewport,
  showLeftPanel,
  showRightPanel,
  showToolbar,
  showPlayer,
}: {
  scenario: WorkspaceLabScenario;
  nodeState: LabNodeState;
  edgeState: LabEdgeState;
  viewport: LabViewport;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showToolbar: boolean;
  showPlayer: boolean;
}) {
  const nodes = useMemo<WorkspaceLabNode[]>(
    () =>
      scenario.nodes.map((item, index) => ({
        ...item,
        selected: index === 0 && nodeState === "selected",
        data: {
          ...item.data,
          state: index === 0 ? nodeState : "default",
        },
      })),
    [nodeState, scenario.nodes],
  );
  const edges = useMemo<WorkspaceLabEdge[]>(
    () =>
      scenario.edges.map((item, index) => ({
        ...item,
        data: {
          ...item.data,
          state: index === 0 ? edgeState : "default",
        },
      })),
    [edgeState, scenario.edges],
  );

  return (
    <div className={`${styles.preview} min-h-0 flex-1 overflow-auto p-4`}>
      <section
        className={`${styles.previewFrame} mx-auto flex h-full min-h-[560px] w-full overflow-hidden bg-white`}
        data-viewport={viewport}
        aria-label="워크스페이스 UI 미리보기"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
            <div>
              <p className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                Workspace
              </p>
              <h1 className="text-sm font-semibold text-slate-900">
                디지털 제품 디자인
              </h1>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
              Saved
            </span>
          </header>

          <div className="flex min-h-0 flex-1">
            {showLeftPanel ? <PreviewLeftPanel /> : null}

            <div className={`${styles.canvas} relative min-h-0 min-w-0 flex-1`}>
              {scenario.nodes.length === 0 ? (
                <div className="absolute inset-0 z-10 grid place-items-center pointer-events-none">
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-8 py-7 text-center backdrop-blur">
                    <div className="mx-auto grid size-10 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                      <Plus className="size-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      첫 번째 노드를 추가하세요
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      아이디어의 시작점을 만들어 트리를 확장할 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : null}

              <ReactFlow
                key={scenario.id}
                nodes={nodes}
                edges={edges}
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
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                />
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

            {showRightPanel ? <PreviewMemoPanel /> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export function WorkspaceLab() {
  const [scenarioId, setScenarioId] =
    useState<WorkspaceLabScenario["id"]>("balanced");
  const [nodeState, setNodeState] = useState<LabNodeState>("default");
  const [edgeState, setEdgeState] = useState<LabEdgeState>("default");
  const [theme, setTheme] = useState<LabTheme>("neutral");
  const [density, setDensity] = useState<LabDensity>("comfortable");
  const [viewport, setViewport] = useState<LabViewport>("desktop");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  const scenario =
    workspaceLabScenarios.find((item) => item.id === scenarioId) ??
    workspaceLabScenarios[0];

  return (
    <main
      className={`${styles.lab} flex h-full min-h-0 w-full bg-slate-100`}
      data-theme={theme}
      data-density={density}
    >
      <WorkspacePreview
        scenario={scenario}
        nodeState={nodeState}
        edgeState={edgeState}
        viewport={viewport}
        showLeftPanel={showLeftPanel}
        showRightPanel={showRightPanel}
        showToolbar={showToolbar}
        showPlayer={showPlayer}
      />

      <WorkspaceLabInspector
        scenarios={workspaceLabScenarios}
        scenarioId={scenarioId}
        nodeState={nodeState}
        edgeState={edgeState}
        theme={theme}
        density={density}
        viewport={viewport}
        showLeftPanel={showLeftPanel}
        showRightPanel={showRightPanel}
        showToolbar={showToolbar}
        showPlayer={showPlayer}
        onScenarioChange={setScenarioId}
        onNodeStateChange={setNodeState}
        onEdgeStateChange={setEdgeState}
        onThemeChange={setTheme}
        onDensityChange={setDensity}
        onViewportChange={setViewport}
        onShowLeftPanelChange={setShowLeftPanel}
        onShowRightPanelChange={setShowRightPanel}
        onShowToolbarChange={setShowToolbar}
        onShowPlayerChange={setShowPlayer}
      />
    </main>
  );
}
