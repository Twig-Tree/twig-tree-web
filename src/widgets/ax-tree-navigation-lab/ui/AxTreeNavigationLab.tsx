"use client";

import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type NodeProps,
  type Viewport,
  useReactFlow,
  useStoreApi,
} from "@xyflow/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Focus,
  Map,
  MousePointer2,
  ScanSearch,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";
import {
  PROTOTYPE_NODE_HEIGHT,
  PROTOTYPE_NODE_WIDTH,
  PROTOTYPE_LAYER_GAP,
  PROTOTYPE_SIBLING_GAP,
  getPrototypeBranchLabel,
  getPrototypeFocusNodeIds,
  prototypeBranchIds,
  prototypeFixture,
  type PrototypeNode,
} from "../model/fixture";
import {
  getReadingViewport,
  type ReadingCapacity,
} from "../model/readingViewport";

type PrototypeKind = "decision" | "exploration";
type ViewState = "overview" | "reading" | "focus";

const READING_MIN_ZOOM = 0.78;
const READING_MAX_ZOOM = 1;
const READING_MIN_ROWS = 4;
const READING_MIN_DEPTHS = 3;
const CAMERA_DURATION = 420;
const READING_FRAME_INSETS = {
  top: 96,
  right: 56,
  bottom: 72,
  left: 56,
} as const;

/*
함수 이름 : PrototypeTreeNode
기능 : 제품의 React Flow 테마를 그대로 쓰면서 프로토타입의 위상 정보와 강조 상태를 표시한다.
인자 : NodeProps<PrototypeNode>
반환값 : 읽기·포커스 상태를 표현하는 트리 노드
*/
function PrototypeTreeNode({ data }: NodeProps<PrototypeNode>) {
  return (
    <div
      className="custom-node grid h-full w-full place-items-center text-inherit"
      data-kind={data.kind}
      data-root={data.kind === "root" || undefined}
      data-highlighted={data.isPath || undefined}
      data-lecture-dimmed={data.isDimmed || undefined}
    >
      {data.kind === "root" ? null : (
        <Handle type="target" position={Position.Left} id="input" />
      )}
      <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
        {data.label}
      </span>
      {data.kind === "leaf" ? null : (
        <Handle type="source" position={Position.Right} id="output" />
      )}
    </div>
  );
}

const nodeTypes = { prototype: PrototypeTreeNode };

/*
함수 이름 : PrototypeFlow
기능 : 결정안 또는 탐색안의 카메라·포커스 동작을 같은 고밀도 트리에서 실행한다.
인자 : PrototypeKind kind -> 비교할 프로토타입 종류
반환값 : 제품 테마를 쓰는 React Flow 프로토타입
*/
function PrototypeFlow({ kind }: { kind: PrototypeKind }) {
  const { fitView, getNode, getZoom, setViewport } =
    useReactFlow<PrototypeNode>();
  const reactFlowStore = useStoreApi();
  const [viewState, setViewState] = useState<ViewState>("overview");
  const [selectedBranchId, setSelectedBranchId] = useState(
    prototypeBranchIds[4],
  );
  const [zoom, setZoom] = useState(0.3);
  const [readingCapacity, setReadingCapacity] =
    useState<ReadingCapacity | null>(null);

  const updateZoom = useCallback(() => setZoom(getZoom()), [getZoom]);

  const showOverview = useCallback(() => {
    setViewState("overview");
    setReadingCapacity(null);
    void fitView({
      padding: "48px",
      minZoom: 0.3,
      maxZoom: 1,
      duration: CAMERA_DURATION,
    }).then(updateZoom);
  }, [fitView, updateZoom]);

  const showReadingView = useCallback(
    (branchId = selectedBranchId) => {
      const node = getNode(branchId);

      if (!node) return;

      const { width, height } = reactFlowStore.getState();
      const readingView = getReadingViewport({
        frameWidth: width,
        frameHeight: height,
        minZoom: READING_MIN_ZOOM,
        maxZoom: READING_MAX_ZOOM,
        minRows: READING_MIN_ROWS,
        minDepths: READING_MIN_DEPTHS,
        focusPosition: node.position,
        focusTopology: node.data.topology,
        nodeWidth: PROTOTYPE_NODE_WIDTH,
        nodeHeight: PROTOTYPE_NODE_HEIGHT,
        layerGap: PROTOTYPE_LAYER_GAP,
        siblingGap: PROTOTYPE_SIBLING_GAP,
        insets: READING_FRAME_INSETS,
      });

      setSelectedBranchId(branchId);
      setViewState("reading");
      setReadingCapacity(readingView.capacity);
      void setViewport(readingView.viewport, {
        duration: CAMERA_DURATION,
      }).then(updateZoom);
    },
    [getNode, reactFlowStore, selectedBranchId, setViewport, updateZoom],
  );

  const focusBranch = useCallback(
    (branchId: string) => {
      const focusNodeIds = new Set(getPrototypeFocusNodeIds(branchId));

      setSelectedBranchId(branchId);
      setViewState("focus");
      void fitView({
        nodes: [...focusNodeIds].map((id) => ({ id })),
        padding: "72px",
        minZoom: READING_MIN_ZOOM,
        maxZoom: 1,
        duration: CAMERA_DURATION,
      }).then(updateZoom);
    },
    [fitView, updateZoom],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(showOverview);

    return () => window.cancelAnimationFrame(frame);
  }, [showOverview]);

  const moveToSibling = (offset: -1 | 1) => {
    const currentIndex = prototypeBranchIds.indexOf(selectedBranchId);
    const nextIndex =
      (currentIndex + offset + prototypeBranchIds.length) %
      prototypeBranchIds.length;

    focusBranch(prototypeBranchIds[nextIndex]);
  };

  const nodes = useMemo(
    () =>
      prototypeFixture.nodes.map((node) => {
        const isInFocusedBranch =
          node.id === selectedBranchId ||
          node.data.branchId === selectedBranchId;

        return {
          ...node,
          selected: node.id === selectedBranchId && viewState !== "overview",
          data: {
            ...node.data,
            isDimmed:
              kind === "exploration" &&
              viewState === "focus" &&
              !isInFocusedBranch,
            isPath:
              kind === "exploration" &&
              viewState === "focus" &&
              isInFocusedBranch,
          },
        };
      }),
    [kind, selectedBranchId, viewState],
  );

  const handleNodeClick = (_: React.MouseEvent, node: PrototypeNode) => {
    const branchId =
      node.data.kind === "root" ? prototypeBranchIds[0] : node.data.branchId;

    if (!branchId) return;

    setSelectedBranchId(branchId);

    if (kind === "exploration") focusBranch(branchId);
  };

  const handleMoveEnd = (_: unknown, viewport: Viewport) => {
    setZoom(viewport.zoom);
  };

  return (
    <div className="flex min-h-[640px] min-w-0 flex-col">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-line px-5 py-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
            {kind === "decision" ? "채택 방향" : "탐색 트랙"}
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-content">
            {kind === "decision"
              ? "A + B · 가독성 하한과 동작 분리"
              : "C · 조망에서 포커스로 이어지는 탐색"}
          </h2>
        </div>
        <span className="min-w-14 rounded-full border border-line bg-surface-muted px-2.5 py-1.5 text-center text-xs text-content-secondary tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas">
        <ReactFlow<PrototypeNode>
          nodes={nodes}
          edges={prototypeFixture.edges}
          nodeTypes={nodeTypes}
          minZoom={0.3}
          maxZoom={1.2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          onNodeClick={handleNodeClick}
          onMoveEnd={handleMoveEnd}
          proOptions={{ hideAttribution: true }}
          aria-label={
            kind === "decision"
              ? "A와 B 결합안 프로토타입"
              : "C 단계적 탐색 프로토타입"
          }
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="var(--theme-canvas-dots)"
            bgColor="transparent"
          />
        </ReactFlow>

        <div className="absolute top-4 left-1/2 z-5 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 rounded-control border border-line bg-surface/95 p-1 shadow-overlay backdrop-blur-sm">
          {kind === "decision" ? (
            <>
              <Button
                variant={viewState === "overview" ? "primary" : "secondary"}
                aria-pressed={viewState === "overview"}
                onClick={showOverview}
              >
                <Map className="size-4" aria-hidden="true" /> 전체 구조
              </Button>
              <Button
                variant={viewState === "reading" ? "primary" : "secondary"}
                aria-pressed={viewState === "reading"}
                onClick={() => showReadingView()}
              >
                <ScanSearch className="size-4" aria-hidden="true" /> 읽기 보기
              </Button>
            </>
          ) : viewState === "focus" ? (
            <>
              <Button onClick={showOverview}>
                <ArrowLeft className="size-4" aria-hidden="true" /> 전체 구조
              </Button>
              <span className="max-w-56 overflow-hidden px-1 text-xs font-semibold text-ellipsis whitespace-nowrap text-content-secondary">
                전체 / {getPrototypeBranchLabel(selectedBranchId)}
              </span>
              <IconButton
                size="sm"
                aria-label="이전 형제"
                onClick={() => moveToSibling(-1)}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                size="sm"
                aria-label="다음 형제"
                onClick={() => moveToSibling(1)}
              >
                <ChevronRight />
              </IconButton>
            </>
          ) : (
            <span className="inline-flex h-10 items-center gap-2 px-3 text-xs text-content-secondary whitespace-nowrap">
              <MousePointer2 className="size-4" aria-hidden="true" /> 관심 있는
              가지를 선택하세요
            </span>
          )}
        </div>

        <p
          role="status"
          aria-live="polite"
          className="absolute right-4 bottom-4 z-5 flex min-h-9 items-center gap-2 rounded-control border border-line bg-surface/95 px-3 py-2 text-xs text-content-secondary shadow-overlay backdrop-blur-sm max-sm:left-4 max-sm:justify-center"
        >
          {kind === "decision" ? (
            viewState === "overview" ? (
              <>
                <Map className="size-4 shrink-0" aria-hidden="true" /> 전체 범위
                우선 · 제목 가독성은 낮을 수 있음
              </>
            ) : (
              <>
                <ScanSearch className="size-4 shrink-0" aria-hidden="true" />
                {readingCapacity
                  ? `${readingCapacity.isMinimumSatisfied ? "읽기 창" : "공간 부족"} · ${Math.round(readingCapacity.zoom * 100)}% · 세로 ${readingCapacity.rows}개(최소 ${READING_MIN_ROWS}) × 깊이 ${readingCapacity.depths}단계(최소 ${READING_MIN_DEPTHS})`
                  : "78% 가독성 하한"}
              </>
            )
          ) : viewState === "focus" ? (
            <>
              <Focus className="size-4 shrink-0" aria-hidden="true" /> 선택한
              가지 강조 · 주변 구조는 맥락으로 유지
            </>
          ) : (
            <>
              <Map className="size-4 shrink-0" aria-hidden="true" /> 전체
              구조에서 관심 영역을 고르는 상태
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Prototype({ kind }: { kind: PrototypeKind }) {
  return (
    <ReactFlowProvider>
      <PrototypeFlow kind={kind} />
    </ReactFlowProvider>
  );
}

/*
함수 이름 : AxTreeNavigationLab
기능 : 고밀도 트리의 전체 조망·읽기·포커스 탐색안을 제품 테마와 현재 React Flow 환경에서 비교한다.
인자 : 없음
반환값 : A+B 결정안과 C 탐색 트랙을 전환하는 개발용 프로토타입
*/
export function AxTreeNavigationLab() {
  const [activePrototype, setActivePrototype] =
    useState<PrototypeKind>("decision");

  return (
    <main className="h-full min-h-0 overflow-y-auto bg-surface-muted p-4 sm:p-6 lg:p-8">
      <header className="mx-auto mb-6 flex max-w-[1440px] flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
            AX Framework · Prototype 01
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-content sm:text-4xl">
            고밀도 트리 탐색
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            같은 트리에서 전체 조망과 읽기 가능한 탐색을 어떻게 함께 제공할지
            비교합니다.
          </p>
        </div>
        <div className="grid gap-1 rounded-card border border-accent-line bg-accent-subtle p-4 shadow-card">
          <span className="text-xs text-content-secondary">현재 결정</span>
          <strong className="text-sm text-content">
            A + B 채택 · C 탐색 유지
          </strong>
        </div>
      </header>

      <nav
        className="mx-auto mb-3 flex max-w-[1440px] gap-2"
        aria-label="프로토타입 선택"
      >
        <Button
          variant={activePrototype === "decision" ? "primary" : "secondary"}
          aria-pressed={activePrototype === "decision"}
          onClick={() => setActivePrototype("decision")}
        >
          <span className="font-mono text-xs" aria-hidden="true">
            A+B
          </span>
          결정안
        </Button>
        <Button
          variant={activePrototype === "exploration" ? "primary" : "secondary"}
          aria-pressed={activePrototype === "exploration"}
          onClick={() => setActivePrototype("exploration")}
        >
          <span className="font-mono text-xs" aria-hidden="true">
            C
          </span>
          고급 탐색 실험
        </Button>
      </nav>

      <section className="mx-auto grid min-h-[680px] max-w-[1440px] grid-cols-1 overflow-hidden rounded-card border border-line bg-surface shadow-panel xl:grid-cols-[minmax(0,1fr)_300px]">
        <Prototype key={activePrototype} kind={activePrototype} />

        <aside className="border-t border-line bg-surface-muted p-6 xl:border-t-0 xl:border-l">
          <p className="text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
            확인 포인트
          </p>
          {activePrototype === "decision" ? (
            <>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-content">
                두 동작의 차이가 즉시 이해되는가?
              </h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-content-secondary">
                <li>`전체 구조`에서 트리의 범위를 확인합니다.</li>
                <li>관심 있는 노드를 선택합니다.</li>
                <li>`읽기 보기`로 전환해 제목을 읽습니다.</li>
              </ol>
              <p className="mt-6 rounded-control border border-line bg-surface p-3 text-xs leading-5 text-content-muted">
                포커스 노드를 넓어진 좌측 상단 패딩에 두고, 최소 세로 4개 × 깊이
                3단계를 만족하는 가장 큰 배율을 계산합니다. 78%는 더 작아지지
                않는 가독성 하한입니다.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-content">
                왕복해도 위치 감각이 유지되는가?
              </h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-content-secondary">
                <li>전체 구조에서 관심 있는 가지를 선택합니다.</li>
                <li>강조·breadcrumb·형제 이동을 사용합니다.</li>
                <li>`전체 구조`로 돌아가 원래 위치를 찾습니다.</li>
              </ol>
              <p className="mt-6 rounded-control border border-line bg-surface p-3 text-xs leading-5 text-content-muted">
                이 안은 즉시 채택하기보다 고급 탐색 구조에서 재사용할 상호작용을
                찾기 위한 실험입니다.
              </p>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
