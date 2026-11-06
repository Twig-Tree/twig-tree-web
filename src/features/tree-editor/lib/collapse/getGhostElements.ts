import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

const GHOST_ID_PREFIX = "ghost:";

type ExitingNode = {
  node: CustomEditorNode; // 사라지기 직전 화면에 그린 노드
  ancestorClientId: string; // 들어갈 자리인, 계속 보이는 가장 가까운 조상
};

export type ExitingElements = {
  nodes: ExitingNode[]; // 접혀서 사라지는 노드
  edges: CustomEditorEdge[]; // 사라지는 노드로 들어가는 엣지
};

type GetExitingElementsParams = {
  renderedNodes: CustomEditorNode[]; // 접히기 직전 화면에 그린 노드 목록
  renderedEdges: CustomEditorEdge[]; // 접히기 직전 화면에 그린 엣지 목록
  nodes: CustomEditorNode[]; // 접힌 뒤 보이는 노드 목록
  storedClientIds: ReadonlySet<string>; // store에 남아 있는 노드 ID. 삭제된 노드를 가려낸다
  storedEdges: CustomEditorEdge[]; // store의 전체 엣지 목록. 숨겨진 조상까지 거슬러 올라간다
};

/*
함수 이름 : getGhostClientId
기능 : 더미 노드의 ID를 만든다. 실제 노드와 ID가 겹치지 않아야 드롭 판정과 화면 이동이 더미를 찾지 않고, 다시 펼칠 때 충돌하지 않는다.
인자 : string clientId -> 원래 노드의 ID
반환값 : 더미 노드의 ID
*/
const getGhostClientId = (clientId: string) => `${GHOST_ID_PREFIX}${clientId}`;

/*
함수 이름 : getOriginalNodes
기능 : 더미 노드를 지금 그려진 모습 그대로 원래 ID의 노드로 되돌린다. 전환 중에 새 전환이 시작될 때 더미가 있던 자리에서 이어 가려고 쓴다.
인자 : CustomEditorNode[] ghostNodes -> 더미 노드 목록
반환값 : 원래 ID를 가진 노드 목록
*/
export const getOriginalNodes = (
  ghostNodes: CustomEditorNode[],
): CustomEditorNode[] =>
  ghostNodes.map((node) => ({
    ...node,
    id: node.id.slice(GHOST_ID_PREFIX.length),
    type: "custom" as const,
  }));

/*
함수 이름 : getExitingElements
기능 : 접혀서 화면에서 빠진 노드와 그 노드로 들어가는 엣지를 찾는다. 삭제된 노드는 store에도 없으므로 대상이 아니다.
노드의 들어갈 자리는 store의 엣지를 따라 올라가 찾은, 계속 보이는 가장 가까운 조상이다.
인자 : GetExitingElementsParams
반환값 : 사라지는 노드와 엣지
*/
export const getExitingElements = ({
  renderedNodes,
  renderedEdges,
  nodes,
  storedClientIds,
  storedEdges,
}: GetExitingElementsParams): ExitingElements => {
  const visibleClientIds = new Set(nodes.map((node) => node.id));
  const parentByChild = new Map(
    storedEdges.map((edge) => [edge.target, edge.source]),
  );

  const exitingNodes = renderedNodes.flatMap((node) => {
    if (visibleClientIds.has(node.id) || !storedClientIds.has(node.id)) {
      return [];
    }

    const visitedClientIds = new Set([node.id]); // 잘못된 구조에 순환이 있어도 계산이 끝나게 한다.
    let ancestorClientId = parentByChild.get(node.id);

    while (
      ancestorClientId !== undefined &&
      !visibleClientIds.has(ancestorClientId)
    ) {
      /*
      보이는 조상을 만나지 못하고 한 바퀴 돌았으면 들어갈 자리가 없다.
      */
      if (visitedClientIds.has(ancestorClientId)) return [];

      visitedClientIds.add(ancestorClientId);
      ancestorClientId = parentByChild.get(ancestorClientId);
    }

    return ancestorClientId === undefined ? [] : [{ node, ancestorClientId }];
  });

  const exitingClientIds = new Set(exitingNodes.map(({ node }) => node.id));

  return {
    nodes: exitingNodes,
    edges: renderedEdges.filter((edge) => exitingClientIds.has(edge.target)),
  };
};

/*
함수 이름 : getOpacityOf
기능 : 노드가 그려지던 투명도를 읽는다.
인자 : CustomEditorNode node -> 노드
반환값 : 투명도. 없으면 1
*/
const getOpacityOf = (node: CustomEditorNode) =>
  typeof node.style?.opacity === "number" ? node.style.opacity : 1;

/*
함수 이름 : getGhostNodes
기능 : 사라지는 노드를 조상의 최종 자리로 옮기며 흐리게 그릴 더미 노드를 만든다. 실제 노드는 이미 데이터에서 빠졌고 더미는 화면에만 있으므로,
조작을 모두 막아 선택되거나 끌리거나 메뉴를 열지 못하게 한다. 조상이 그 사이 사라졌으면 들어갈 자리가 없어 만들지 않는다.
인자 : ExitingElements exiting -> 사라지는 노드와 엣지
CustomEditorNode[] nodes -> 최종 좌표를 가진 노드 목록
number progress -> 0과 1 사이의 이동 진행률
반환값 : 더미 노드 목록
*/
export const getGhostNodes = (
  exiting: ExitingElements,
  nodes: CustomEditorNode[],
  progress: number,
): CustomEditorNode[] => {
  if (progress >= 1) return []; // 연결선이 드러나는 동안 전환이 이어져도 도착한 더미는 남기지 않는다.

  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return exiting.nodes.flatMap(({ node, ancestorClientId }) => {
    const ancestor = nodesById.get(ancestorClientId);

    if (!ancestor) return [];

    return [
      {
        ...node,
        id: getGhostClientId(node.id),
        type: "ghost" as const,
        position: {
          x:
            node.position.x +
            (ancestor.position.x - node.position.x) * progress,
          y:
            node.position.y +
            (ancestor.position.y - node.position.y) * progress,
        },
        style: {
          ...node.style,
          opacity: getOpacityOf(node) * (1 - progress),
          pointerEvents: "none" as const,
        },
        zIndex: -1, // 조상 뒤로 들어가게 한다.
        selected: false,
        dragging: false,
        draggable: false,
        selectable: false,
        focusable: false,
        connectable: false,
        deletable: false,
        domAttributes: { "aria-hidden": true },
      },
    ];
  });
};

/*
함수 이름 : getGhostEdges
기능 : 더미 노드로 들어가는 엣지를 주어진 투명도로 만든다. 출발 노드도 사라지는 중이면 그 더미에서 출발한다. 다 흐려지면 만들지 않는다.
인자 : ExitingElements exiting -> 사라지는 노드와 엣지
CustomEditorNode[] ghostNodes -> 지금 그릴 더미 노드 목록
number opacity -> 엣지 투명도
반환값 : 더미 엣지 목록
*/
export const getGhostEdges = (
  exiting: ExitingElements,
  ghostNodes: CustomEditorNode[],
  opacity: number,
): CustomEditorEdge[] => {
  if (opacity === 0) return [];

  const ghostIds = new Set(ghostNodes.map((node) => node.id));
  const exitingClientIds = new Set(exiting.nodes.map(({ node }) => node.id));

  return exiting.edges.flatMap((edge) => {
    const target = getGhostClientId(edge.target);
    const source = exitingClientIds.has(edge.source)
      ? getGhostClientId(edge.source)
      : edge.source;

    if (
      !ghostIds.has(target) ||
      (exitingClientIds.has(edge.source) && !ghostIds.has(source))
    ) {
      return [];
    }

    return [
      {
        ...edge,
        id: getGhostClientId(edge.id),
        source,
        target,
        style: { ...edge.style, opacity },
        selected: false,
        selectable: false,
        focusable: false,
        deletable: false,
        domAttributes: { "aria-hidden": true },
      },
    ];
  });
};
