import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getAncestorClientIds } from "../getAncestorClientIds";
import { MoveNodeParams } from "./getMovedElements";
import { getNodePlacement } from "./getNodePlacement";

/*
놓은 지점에서 이 거리(flow 좌표) 안에 노드가 없으면 놓을 대상이 없는 것으로 본다. 형제 간격과 층 간격의 절반보다
크므로, 노드 사이의 빈칸은 어느 한쪽 노드에 닿는다.
*/
export const MAX_DROP_DISTANCE = 40;

/*
노드 높이에서 앞·뒤 영역이 차지하는 비율. 나머지 가운데 영역에 놓으면 그 노드의 자식이 된다.
*/
const EDGE_ZONE_RATIO = 0.25;

export type DropTargetKind = "before" | "after" | "child";

export type DropTarget = MoveNodeParams & {
  kind: DropTargetKind; // 기준 노드의 앞, 뒤, 자식 중 어디에 놓는지. 놓을 위치 표시가 쓴다
  anchorClientId: string; // 놓을 위치의 기준이 되는 노드의 편집기 노드 ID
};

type GetDropTargetParams = {
  draggedClientId: string; // 끄는 노드의 편집기 노드 ID
  point: { x: number; y: number }; // 놓은 지점. flow 좌표
  visibleNodes: CustomEditorNode[]; // 화면에 보이는 노드 목록. 놓을 대상 후보다
  nodes: CustomEditorNode[]; // editor store의 노드 전체. 접혀 숨겨진 형제까지 세어 순번을 정한다
  edges: CustomEditorEdge[]; // editor store의 엣지 전체
};

/*
함수 이름 : getNodeRect
기능 : 노드가 화면에서 차지하는 상자를 구한다. 그려진 크기(measured)를 먼저 쓰고, 아직 그려지지 않았으면 레이아웃이 정한 크기를 쓴다.
인자 : CustomEditorNode node -> 상자를 구할 노드
반환값 : 상자의 왼쪽 위 좌표와 크기. 크기를 모르면 null
*/
const getNodeRect = (node: CustomEditorNode) => {
  const width = node.measured?.width ?? node.width;
  const height = node.measured?.height ?? node.height;

  if (!width || !height) return null;

  return { x: node.position.x, y: node.position.y, width, height };
};

/*
함수 이름 : getDescendantClientIds
기능 : 엣지를 따라 노드의 하위 노드를 모두 모은다.
인자 : CustomEditorEdge[] edges -> 엣지 목록
string clientId -> 기준 노드의 편집기 노드 ID
반환값 : 하위 노드의 편집기 노드 ID 집합. 기준 노드는 들어 있지 않다
*/
const getDescendantClientIds = (
  edges: CustomEditorEdge[],
  clientId: string,
): Set<string> => {
  /*
  드래그 중에는 커서가 움직일 때마다 불리므로, 엣지를 한 번만 훑어 부모별 자식 목록을 만든 뒤 따라 내려간다.
  */
  const childClientIdsByParent = new Map<string, string[]>();

  edges.forEach((edge) => {
    const childClientIds = childClientIdsByParent.get(edge.source);

    if (childClientIds) {
      childClientIds.push(edge.target);
    } else {
      childClientIdsByParent.set(edge.source, [edge.target]);
    }
  });

  const descendantClientIds = new Set<string>();
  const stack = [clientId];

  /*
  이미 모은 노드는 다시 넣지 않아, 엣지가 어긋나 순환이 생겨도 탐색이 끝난다.
  */
  while (stack.length > 0) {
    const currentClientId = stack.pop()!;

    for (const childClientId of childClientIdsByParent.get(currentClientId) ??
      []) {
      if (!descendantClientIds.has(childClientId)) {
        descendantClientIds.add(childClientId);
        stack.push(childClientId);
      }
    }
  }

  return descendantClientIds;
};

/*
함수 이름 : getDropTarget
기능 : 끌던 노드를 놓은 지점에서 목적지 부모와 순번을 정한다. 가장 가까운 보이는 노드를 기준으로, 그 노드의 위쪽 1/4이면 바로 앞,
아래쪽 1/4이면 바로 뒤, 가운데면 그 노드의 자식 맨 끝이다. 레이아웃 방향이 RIGHT라 형제가 세로로 쌓이므로 위·아래로 앞뒤를 가른다.

형제 사이의 빈칸만으로 정하지 않는 이유는 경계가 모호해서다. 한 부모의 마지막 자식과 다른 부모의 첫 자식이 같은 열에 붙어 있으면
그 사이의 빈칸은 어느 부모의 자리인지 정할 수 없다. 가까운 노드의 위·아래로 정하면 이 모호함이 없다.
인자 : GetDropTargetParams
반환값 : 목적지와 놓을 위치 표시에 쓸 기준. 놓을 수 없거나 원래 자리와 같으면 null
*/
export const getDropTarget = ({
  draggedClientId,
  point,
  visibleNodes,
  nodes,
  edges,
}: GetDropTargetParams): DropTarget | null => {
  const currentPlacement = getNodePlacement(nodes, edges, draggedClientId);

  if (!currentPlacement) return null; // 루트는 옮길 수 없다.

  /*
  자기 자신과 하위 노드 위에 놓으면 순환이 되므로 후보에서 뺀다. 하위 노드는 끄는 동안 제자리에 있어 놓은 지점 근처에 남아 있다.
  */
  const excludedClientIds = getDescendantClientIds(edges, draggedClientId);
  excludedClientIds.add(draggedClientId);

  let anchor: {
    node: CustomEditorNode;
    rect: NonNullable<ReturnType<typeof getNodeRect>>;
    distance: number;
  } | null = null;

  for (const node of visibleNodes) {
    const rect = getNodeRect(node);
    if (!rect) continue;

    // 상자 안이면 0, 밖이면 상자 가장자리까지의 거리다.
    const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
    const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
    const distance = Math.hypot(dx, dy);

    if (excludedClientIds.has(node.id)) {
      /*
      하위 노드 위에 놓으면 근처에 다른 노드가 있어도 그 노드를 기준으로 삼지 않고 원래 자리로 돌린다.
      끄는 노드 자신은 늘 커서 아래에 있으므로 이 검사에서 뺀다.
      */
      if (node.id !== draggedClientId && distance === 0) return null;

      continue;
    }

    if (
      distance <= MAX_DROP_DISTANCE &&
      (!anchor || distance < anchor.distance)
    ) {
      anchor = { node, rect, distance };
    }
  }

  if (!anchor) return null;

  const { node: anchorNode, rect } = anchor;
  const ratio = (point.y - rect.y) / rect.height; // 상자 위쪽 밖이면 0보다 작고 아래쪽 밖이면 1보다 크다.
  const kind: DropTargetKind =
    ratio < EDGE_ZONE_RATIO
      ? "before"
      : ratio > 1 - EDGE_ZONE_RATIO
        ? "after"
        : "child";

  let target: MoveNodeParams;

  if (kind === "child") {
    /*
    접힌 노드의 자식은 화면에 없지만 순번에는 들어가므로 store 엣지 전체로 센다.
    */
    const childCount = edges.filter(
      (edge) =>
        edge.source === anchorNode.id && edge.target !== draggedClientId,
    ).length;

    target = {
      clientId: draggedClientId,
      parentClientId: anchorNode.id,
      position: childCount + 1,
    };
  } else {
    const anchorParentClientId = edges.find(
      (edge) => edge.target === anchorNode.id,
    )?.source;

    if (anchorParentClientId === undefined) return null; // 루트의 앞뒤에는 형제 자리가 없다.

    /*
    position은 끄는 노드를 뺀 형제 사이의 순번이다. 같은 부모에서 뒤쪽 형제의 뒤에 놓아도 자기가 빠진 만큼 당겨 센다.
    */
    const siblingClientIds = new Set(
      edges
        .filter((edge) => edge.source === anchorParentClientId)
        .map((edge) => edge.target),
    );
    const anchorIndex = nodes
      .filter(
        (node) => siblingClientIds.has(node.id) && node.id !== draggedClientId,
      )
      .findIndex((node) => node.id === anchorNode.id);

    target = {
      clientId: draggedClientId,
      parentClientId: anchorParentClientId,
      position: kind === "before" ? anchorIndex + 1 : anchorIndex + 2,
    };
  }

  /*
  하위 노드를 후보에서 뺐으므로 순환은 생기지 않지만, 판정 규칙이 바뀌어도 서버 거절 전에 막히도록 한 번 더 확인한다.
  */
  if (
    target.parentClientId === draggedClientId ||
    getAncestorClientIds(edges, target.parentClientId).includes(draggedClientId)
  ) {
    return null;
  }

  if (
    target.parentClientId === currentPlacement.parentClientId &&
    target.position === currentPlacement.position
  ) {
    return null;
  }

  return { ...target, kind, anchorClientId: anchorNode.id };
};
