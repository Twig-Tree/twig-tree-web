import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ExitingElements,
  getExitingElements,
  getGhostEdges,
  getGhostNodes,
} from "../../lib/collapse/getGhostElements";
import {
  addEnteringFrames,
  getNodeFrames,
  getTransitionEdges,
  getTransitionNodes,
  hasChangingNode,
  NodeFrames,
} from "../../lib/collapse/getTransitionNodes";
import { easeCubicInOut, getMotionDuration } from "../../lib/motion";
import { useTreeStore } from "../treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../types";
import { useCollapseStore } from "./collapseStore";

type UseNodeTransitionParams = {
  nodes: CustomEditorNode[]; // 레이아웃이 정한 최종 좌표를 가진 노드 목록
  edges: CustomEditorEdge[]; // 보이는 엣지 목록. 새로 나타난 노드의 조상을 찾고 함께 드러낸다
  isLayoutRunning: () => boolean; // 레이아웃 계산이 진행 중인지. 끝나야 목표 좌표가 정해진다
};

type RenderedElements = {
  frames: NodeFrames; // 그린 모습
  nodes: CustomEditorNode[]; // 그린 노드 목록. 더미는 뺀다
  edges: CustomEditorEdge[]; // 그린 엣지 목록. 더미는 뺀다
};

type NodeTransition = {
  fromFrames: NodeFrames; // 전환을 시작한 모습
  exiting: ExitingElements; // 접혀서 사라지는 노드와 엣지. 더미로 그린다
  progress: number; // 0과 1 사이의 이동 진행률
};

/*
함수 이름 : useNodeTransition
기능 : 접힘이 바뀌어 배치가 달라지면 노드를 이전 좌표에서 새 좌표로 옮기며 그릴 노드와 엣지 목록을 만든다.
새로 나타난 노드는 이전 화면에 있던 조상의 자리에서 투명하게 출발해 제자리로 간다. 접혀서 사라지는 노드는 이미 데이터에서 빠졌으므로,
화면에 넘기는 목록에만 더미를 더해 조상의 자리로 들여보낸다.
store에는 최종 좌표만 두고 화면에 그릴 좌표만 따로 계산하므로, 드롭 판정·레이아웃·undo는 전환을 모른다.
연결선은 React Flow가 노드 좌표로 그리므로 함께 움직인다.
인자 : UseNodeTransitionParams
반환값 : 화면에 그릴 노드 목록과 엣지 목록, 전환 중인지 여부
*/
export const useNodeTransition = ({
  nodes,
  edges,
  isLayoutRunning,
}: UseNodeTransitionParams) => {
  const collapsedServerIds = useCollapseStore(
    (state) => state.collapsedServerIds,
  );
  const collapseTreeId = useCollapseStore((state) => state.treeId);

  const [transition, setTransition] = useState<NodeTransition | null>(null);

  const movedNodes = useMemo(
    () =>
      transition
        ? getTransitionNodes(nodes, transition.fromFrames, transition.progress)
        : nodes,
    [nodes, transition],
  );

  const movedEdges = useMemo(
    () =>
      transition
        ? getTransitionEdges(edges, transition.fromFrames, transition.progress)
        : edges,
    [edges, transition],
  );

  const ghostNodes = useMemo(
    () =>
      transition
        ? getGhostNodes(transition.exiting, nodes, transition.progress)
        : [],
    [nodes, transition],
  );

  const ghostEdges = useMemo(
    () => (transition ? getGhostEdges(transition.exiting, ghostNodes) : []),
    [ghostNodes, transition],
  );

  const transitionNodes = useMemo(
    () => (ghostNodes.length > 0 ? [...ghostNodes, ...movedNodes] : movedNodes),
    [ghostNodes, movedNodes],
  );

  const transitionEdges = useMemo(
    () => (ghostEdges.length > 0 ? [...ghostEdges, ...movedEdges] : movedEdges),
    [ghostEdges, movedEdges],
  );

  const renderedRef = useRef<RenderedElements>({
    frames: new Map(),
    nodes: [],
    edges: [],
  }); // 직전 렌더에 그린 요소
  const seenCollapseRef = useRef({ collapsedServerIds, collapseTreeId });
  const pendingFromRef = useRef<RenderedElements | null>(null); // 레이아웃 결과를 기다리는 전환의 시작 상태
  const frameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  /*
  접힘이 바뀐 렌더에는 아직 이전 좌표가 들어 있고 새 좌표는 레이아웃이 끝난 뒤의 렌더에 온다. 그래서 접힘이 바뀌는 순간
  시작 좌표를 잡아 두고, 레이아웃 결과가 온 렌더에서 전환을 시작한다. 두 렌더 모두 페인트 전에 끝나므로 새 좌표가 먼저 보이지 않는다.
  시작 모습은 접힘이 바뀌기 전의 것이어야 새로 나타난 노드를 가려낼 수 있다. 숨겨져 있던 때의 낡은 좌표에서 출발하지 않게 하는 기준이기도 하다.

  저장된 접힘을 복원할 때는 트리 ID가 함께 바뀌므로 잡지 않는다. 잡으면 페이지를 열 때마다 노드가 움직인다.
  */
  useLayoutEffect(() => {
    const seenCollapse = seenCollapseRef.current;

    if (seenCollapse.collapsedServerIds !== collapsedServerIds) {
      if (
        seenCollapse.collapseTreeId === collapseTreeId &&
        pendingFromRef.current === null
      ) {
        pendingFromRef.current = renderedRef.current;
      }

      seenCollapseRef.current = { collapsedServerIds, collapseTreeId };
    }

    renderedRef.current = {
      frames: getNodeFrames(movedNodes),
      nodes: movedNodes,
      edges,
    };

    const pendingFrom = pendingFromRef.current;

    if (pendingFrom === null || isLayoutRunning()) return;

    pendingFromRef.current = null;

    const fromFrames = addEnteringFrames(nodes, edges, pendingFrom.frames);
    const exiting = getExitingElements({
      renderedNodes: pendingFrom.nodes,
      renderedEdges: pendingFrom.edges,
      nodes,
      storedClientIds: new Set(
        useTreeStore.getState().nodes.map((node) => node.id),
      ),
    });

    const duration = getMotionDuration();
    const isDragging = nodes.some((node) => node.dragging); // 끄는 노드의 좌표는 포인터가 정한다. 다른 탭의 접힘 변경으로 여기에 올 수 있다.

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const shouldMove =
      duration > 0 &&
      !isDragging &&
      (exiting.nodes.length > 0 || hasChangingNode(nodes, fromFrames));

    /*
    새 좌표가 페인트되기 전에 시작 좌표로 되돌려야 하므로 layout effect 안에서 바로 바꾼다. 다음 프레임으로 미루면 노드가 새 자리에 한 번 보였다가 돌아온다.
    */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransition(shouldMove ? { fromFrames, exiting, progress: 0 } : null);

    if (!shouldMove) return;

    const startTime = performance.now();

    const advanceTransition = (now: number) => {
      const elapsed = Math.max(0, now - startTime);

      if (elapsed >= duration) {
        frameRef.current = null;
        setTransition(null);
        return;
      }

      setTransition({
        fromFrames,
        exiting,
        progress: easeCubicInOut(elapsed / duration),
      });
      frameRef.current = requestAnimationFrame(advanceTransition);
    };

    frameRef.current = requestAnimationFrame(advanceTransition);
  }, [
    nodes,
    edges,
    movedNodes,
    collapsedServerIds,
    collapseTreeId,
    isLayoutRunning,
  ]);

  return {
    transitionNodes,
    transitionEdges,
    isTransitioning: transition !== null,
  };
};
