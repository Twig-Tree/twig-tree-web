import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

export type ExitingNode = {
  node: CustomEditorNode; // 사라지기 직전 화면에 그린 노드
  ancestorClientId: string; // 들어갈 자리인, 계속 보이는 가장 가까운 조상
};

type GetExitingNodesParams = {
  renderedNodes: CustomEditorNode[]; // 접히기 직전 화면에 그린 노드 목록
  renderedEdges: CustomEditorEdge[]; // 접히기 직전 화면에 그린 엣지 목록
  nodes: CustomEditorNode[]; // 접힌 뒤 보이는 노드 목록
  storedClientIds: ReadonlySet<string>; // store에 남아 있는 노드 ID. 삭제된 노드를 가려낸다
};

/*
함수 이름 : getGhostClientId
기능 : 더미 노드의 ID를 만든다. 실제 노드와 ID가 겹치지 않아야 드롭 판정과 화면 이동이 더미를 찾지 않고, 다시 펼칠 때 충돌하지 않는다.
인자 : string clientId -> 원래 노드의 ID
반환값 : 더미 노드의 ID
*/
const getGhostClientId = (clientId: string) => `ghost:${clientId}`;

/*
함수 이름 : getExitingNodes
기능 : 접혀서 화면에서 빠진 노드를 찾는다. 삭제된 노드는 store에도 없으므로 대상이 아니다.
노드의 들어갈 자리는 접히기 전 엣지를 따라 올라가 찾은, 계속 보이는 가장 가까운 조상이다.
인자 : GetExitingNodesParams
반환값 : 사라지는 노드 목록
*/
export const getExitingNodes = ({
  renderedNodes,
  renderedEdges,
  nodes,
  storedClientIds,
}: GetExitingNodesParams): ExitingNode[] => {
  const visibleClientIds = new Set(nodes.map((node) => node.id));
  const parentByChild = new Map(
    renderedEdges.map((edge) => [edge.target, edge.source]),
  );

  return renderedNodes.flatMap((node) => {
    if (visibleClientIds.has(node.id) || !storedClientIds.has(node.id)) {
      return [];
    }

    let ancestorClientId = parentByChild.get(node.id);

    while (
      ancestorClientId !== undefined &&
      !visibleClientIds.has(ancestorClientId)
    ) {
      ancestorClientId = parentByChild.get(ancestorClientId);
    }

    return ancestorClientId === undefined ? [] : [{ node, ancestorClientId }];
  });
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
인자 : ExitingNode[] exitingNodes -> 사라지는 노드 목록
CustomEditorNode[] nodes -> 최종 좌표를 가진 노드 목록
number progress -> 0과 1 사이의 이동 진행률
반환값 : 더미 노드 목록
*/
export const getGhostNodes = (
  exitingNodes: ExitingNode[],
  nodes: CustomEditorNode[],
  progress: number,
): CustomEditorNode[] => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return exitingNodes.flatMap(({ node, ancestorClientId }) => {
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
