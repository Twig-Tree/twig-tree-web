import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { SIBLING_GAP } from "../layout";
import { DropTarget } from "./getDropTarget";

export type Rect = {
  x: number; // 왼쪽 위 x. flow 좌표
  y: number; // 왼쪽 위 y. flow 좌표
  width: number;
  height: number;
};

/*
놓일 자리 표시. 앞뒤에 넣을 때는 형제 사이의 삽입선을, 자식으로 넣을 때는 기준 노드를 둘러싼 강조 상자를 그린다.
*/
export type DropIndicator = {
  kind: "line" | "anchor";
  rect: Rect;
};

const LINE_THICKNESS = 4; // 삽입선 두께. flow 좌표
const ANCHOR_PADDING = 6; // 강조 상자가 기준 노드 바깥으로 벌어지는 폭. flow 좌표

/*
함수 이름 : getRenderedRect
기능 : 노드가 화면에 그려진 상자를 구한다. 그려진 크기(measured)를 먼저 쓰고, 없으면 레이아웃이 정한 크기를 쓴다.
인자 : CustomEditorNode node -> 상자를 구할 노드
반환값 : 노드 상자. 크기를 모르면 null
*/
const getRenderedRect = (node: CustomEditorNode): Rect | null => {
  const width = node.measured?.width ?? node.width;
  const height = node.measured?.height ?? node.height;

  if (!width || !height) return null;

  return { x: node.position.x, y: node.position.y, width, height };
};

/*
함수 이름 : getDropIndicator
기능 : 끄는 노드가 놓일 자리를 표시할 모양과 위치를 구한다. 앞뒤에 놓으면 기준 노드와 이웃 형제 사이 빈칸의 가운데에 삽입선을,
자식으로 놓으면 기준 노드를 둘러싼 강조 상자를 둔다. 레이아웃 방향이 RIGHT라 형제가 세로로 쌓이므로 삽입선은 가로다.
인자 : DropTarget dropTarget -> 놓을 목적지
string draggedClientId -> 끄는 노드의 편집기 노드 ID. 빠질 자리라 이웃으로 보지 않는다
CustomEditorNode[] visibleNodes -> 화면에 보이는 노드 목록
CustomEditorEdge[] edges -> editor store의 엣지 목록
반환값 : 놓일 자리 표시. 기준 노드의 크기를 모르면 null
*/
export const getDropIndicator = (
  dropTarget: DropTarget,
  draggedClientId: string,
  visibleNodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): DropIndicator | null => {
  const anchorNode = visibleNodes.find(
    (node) => node.id === dropTarget.anchorClientId,
  );
  const anchorRect = anchorNode && getRenderedRect(anchorNode);

  if (!anchorRect) return null;

  if (dropTarget.kind === "child") {
    return {
      kind: "anchor",
      rect: {
        x: anchorRect.x - ANCHOR_PADDING,
        y: anchorRect.y - ANCHOR_PADDING,
        width: anchorRect.width + ANCHOR_PADDING * 2,
        height: anchorRect.height + ANCHOR_PADDING * 2,
      },
    };
  }

  /*
  보이는 형제를 화면 순서(노드 배열 순서)대로 모아 기준 노드의 이웃을 찾는다.
  */
  const siblingClientIds = new Set(
    edges
      .filter((edge) => edge.source === dropTarget.parentClientId)
      .map((edge) => edge.target),
  );
  const siblings = visibleNodes.filter(
    (node) => siblingClientIds.has(node.id) && node.id !== draggedClientId,
  );
  const anchorIndex = siblings.findIndex(
    (node) => node.id === dropTarget.anchorClientId,
  );
  const neighborNode =
    dropTarget.kind === "before"
      ? siblings[anchorIndex - 1]
      : siblings[anchorIndex + 1];
  const neighborRect = neighborNode && getRenderedRect(neighborNode);

  /*
  이웃 형제가 있으면 두 노드 사이 빈칸의 가운데에, 없으면 기준 노드에서 형제 간격의 절반만큼 떨어진 자리에 둔다.
  */
  const lineCenterY =
    dropTarget.kind === "before"
      ? neighborRect
        ? (neighborRect.y + neighborRect.height + anchorRect.y) / 2
        : anchorRect.y - SIBLING_GAP / 2
      : neighborRect
        ? (anchorRect.y + anchorRect.height + neighborRect.y) / 2
        : anchorRect.y + anchorRect.height + SIBLING_GAP / 2;

  return {
    kind: "line",
    rect: {
      x: anchorRect.x,
      y: lineCenterY - LINE_THICKNESS / 2,
      width: anchorRect.width,
      height: LINE_THICKNESS,
    },
  };
};
