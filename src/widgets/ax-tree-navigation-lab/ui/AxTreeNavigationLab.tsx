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
import styles from "./AxTreeNavigationLab.module.css";

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

function PrototypeTreeNode({ data }: NodeProps<PrototypeNode>) {
  return (
    <div
      className={`custom-node ${styles.treeNode}`}
      data-kind={data.kind}
      data-root={data.kind === "root" || undefined}
      data-highlighted={data.isPath || undefined}
      data-lecture-dimmed={data.isDimmed || undefined}
    >
      {data.kind === "root" ? null : (
        <Handle type="target" position={Position.Left} id="input" />
      )}
      <span className={styles.nodeLabel}>{data.label}</span>
      {data.kind === "leaf" ? null : (
        <Handle type="source" position={Position.Right} id="output" />
      )}
    </div>
  );
}

const nodeTypes = { prototype: PrototypeTreeNode };

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
    <div className={styles.prototypeShell}>
      <div className={styles.prototypeHeader}>
        <div>
          <span className={styles.prototypeKicker}>
            {kind === "decision" ? "채택 방향" : "탐색 트랙"}
          </span>
          <h2>
            {kind === "decision"
              ? "A + B · 가독성 하한과 동작 분리"
              : "C · 조망에서 포커스로 이어지는 탐색"}
          </h2>
        </div>
        <span className={styles.zoomBadge}>{Math.round(zoom * 100)}%</span>
      </div>

      <div className={styles.canvasFrame}>
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

        <div className={styles.canvasToolbar}>
          {kind === "decision" ? (
            <>
              <button
                type="button"
                data-active={viewState === "overview" || undefined}
                aria-pressed={viewState === "overview"}
                onClick={showOverview}
              >
                <Map aria-hidden="true" /> 전체 구조
              </button>
              <button
                type="button"
                data-active={viewState === "reading" || undefined}
                aria-pressed={viewState === "reading"}
                onClick={() => showReadingView()}
              >
                <ScanSearch aria-hidden="true" /> 읽기 보기
              </button>
            </>
          ) : viewState === "focus" ? (
            <>
              <button type="button" onClick={showOverview}>
                <ArrowLeft aria-hidden="true" /> 전체 구조
              </button>
              <span className={styles.breadcrumb}>
                전체 / {getPrototypeBranchLabel(selectedBranchId)}
              </span>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="이전 형제"
                onClick={() => moveToSibling(-1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="다음 형제"
                onClick={() => moveToSibling(1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          ) : (
            <span className={styles.guideText}>
              <MousePointer2 aria-hidden="true" /> 관심 있는 가지를 선택하세요
            </span>
          )}
        </div>

        <div className={styles.canvasStatus}>
          {kind === "decision" ? (
            viewState === "overview" ? (
              <>
                <Map aria-hidden="true" /> 전체 범위 우선 · 제목 가독성은 낮을
                수 있음
              </>
            ) : (
              <>
                <ScanSearch aria-hidden="true" />
                {readingCapacity
                  ? `${readingCapacity.isMinimumSatisfied ? "읽기 창" : "공간 부족"} · ${Math.round(readingCapacity.zoom * 100)}% · 세로 ${readingCapacity.rows}개(최소 ${READING_MIN_ROWS}) × 깊이 ${readingCapacity.depths}단계(최소 ${READING_MIN_DEPTHS})`
                  : "78% 가독성 하한"}
              </>
            )
          ) : viewState === "focus" ? (
            <>
              <Focus aria-hidden="true" /> 선택한 가지 강조 · 주변 구조는
              맥락으로 유지
            </>
          ) : (
            <>
              <Map aria-hidden="true" /> 전체 구조에서 관심 영역을 고르는 상태
            </>
          )}
        </div>
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

export function AxTreeNavigationLab() {
  const [activePrototype, setActivePrototype] =
    useState<PrototypeKind>("decision");

  return (
    <main className={styles.lab}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>AX Framework · Prototype 01</span>
          <h1>고밀도 트리 탐색</h1>
          <p>
            같은 트리에서 전체 조망과 읽기 가능한 탐색을 어떻게 함께 제공할지
            비교합니다.
          </p>
        </div>
        <div className={styles.decisionSummary}>
          <span>현재 결정</span>
          <strong>A + B 채택 · C 탐색 유지</strong>
        </div>
      </header>

      <nav className={styles.prototypeTabs} aria-label="프로토타입 선택">
        <button
          type="button"
          data-active={activePrototype === "decision" || undefined}
          aria-current={activePrototype === "decision" ? "page" : undefined}
          onClick={() => setActivePrototype("decision")}
        >
          <span>A + B</span>
          결정안
        </button>
        <button
          type="button"
          data-active={activePrototype === "exploration" || undefined}
          aria-current={activePrototype === "exploration" ? "page" : undefined}
          onClick={() => setActivePrototype("exploration")}
        >
          <span>C</span>
          고급 탐색 실험
        </button>
      </nav>

      <section className={styles.prototypeArea}>
        <Prototype key={activePrototype} kind={activePrototype} />

        <aside className={styles.reviewPanel}>
          <span className={styles.reviewKicker}>확인 포인트</span>
          {activePrototype === "decision" ? (
            <>
              <h2>두 동작의 차이가 즉시 이해되는가?</h2>
              <ol>
                <li>`전체 구조`에서 트리의 범위를 확인합니다.</li>
                <li>관심 있는 노드를 선택합니다.</li>
                <li>`읽기 보기`로 전환해 제목을 읽습니다.</li>
              </ol>
              <p>
                포커스 노드를 넓어진 좌측 상단 패딩에 두고, 최소 세로 4개 × 깊이
                3단계를 만족하는 가장 큰 배율을 계산합니다. 78%는 더 작아지지
                않는 가독성 하한입니다.
              </p>
            </>
          ) : (
            <>
              <h2>왕복해도 위치 감각이 유지되는가?</h2>
              <ol>
                <li>전체 구조에서 관심 있는 가지를 선택합니다.</li>
                <li>강조·breadcrumb·형제 이동을 사용합니다.</li>
                <li>`전체 구조`로 돌아가 원래 위치를 찾습니다.</li>
              </ol>
              <p>
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
