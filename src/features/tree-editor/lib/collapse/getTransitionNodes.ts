import { type XYPosition } from "@xyflow/react";
import { CustomEditorEdge, CustomEditorNode } from "../../model/types";

type NodeFrame = {
  position: XYPosition; // 화면에 그린 좌표
  opacity: number; // 화면에 그린 투명도. 전환 중이 아니면 1
};

export type NodeFrames = ReadonlyMap<string, NodeFrame>; // 노드 ID별로 화면에 그린 모습

/*
함수 이름 : getNodeFrames
기능 : 노드 목록에서 ID별로 화면에 그린 좌표와 투명도를 모은다. 전환 중에 새 전환이 시작되면 이 값에서 이어서 움직인다.
인자 : CustomEditorNode[] nodes -> 화면에 그린 노드 목록
반환값 : 노드 ID별로 화면에 그린 모습
*/
export const getNodeFrames = (nodes: CustomEditorNode[]): NodeFrames =>
  new Map(
    nodes.map((node) => [
      node.id,
      {
        position: node.position,
        opacity:
          typeof node.style?.opacity === "number" ? node.style.opacity : 1,
      },
    ]),
  );

/*
함수 이름 : addEnteringFrames
기능 : 새로 나타난 노드가 출발할 모습을 더한다. 새 노드는 이전 화면에 있던 가장 가까운 조상의 자리에서 투명하게 출발한다.
여러 계층을 한 번에 펼쳐도 모두 그 조상에서 나온다. 이전 화면에 조상이 없으면 출발할 자리가 없어 더하지 않는다.
인자 : CustomEditorNode[] nodes -> 목표 좌표를 가진 노드 목록
CustomEditorEdge[] edges -> 보이는 엣지 목록
NodeFrames fromFrames -> 이전 화면의 모습
반환값 : 새로 나타난 노드까지 더한 시작 모습
*/
export const addEnteringFrames = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  fromFrames: NodeFrames,
): NodeFrames => {
  const parentByChild = new Map(
    edges.map((edge) => [edge.target, edge.source]),
  );
  const frames = new Map(fromFrames);

  nodes.forEach((node) => {
    if (fromFrames.has(node.id)) return;

    let ancestorId = parentByChild.get(node.id);

    while (ancestorId !== undefined && !fromFrames.has(ancestorId)) {
      ancestorId = parentByChild.get(ancestorId);
    }

    const ancestorFrame =
      ancestorId === undefined ? undefined : fromFrames.get(ancestorId);

    if (ancestorFrame) {
      frames.set(node.id, { position: ancestorFrame.position, opacity: 0 });
    }
  });

  return frames;
};

/*
함수 이름 : hasChangingNode
기능 : 시작 모습이 있는 노드 중 전환할 노드가 있는지 확인한다. 시작 모습이 없는 노드는 옮길 수 없으므로 보지 않는다.
인자 : CustomEditorNode[] nodes -> 목표 좌표를 가진 노드 목록
NodeFrames fromFrames -> 시작 모습
반환값 : 전환할 노드가 있으면 true
*/
export const hasChangingNode = (
  nodes: CustomEditorNode[],
  fromFrames: NodeFrames,
): boolean =>
  nodes.some((node) => {
    const from = fromFrames.get(node.id);

    return (
      from !== undefined &&
      (from.opacity < 1 ||
        from.position.x !== node.position.x ||
        from.position.y !== node.position.y)
    );
  });

/*
함수 이름 : getOpacityAt
기능 : 시작 투명도에서 1까지 진행률만큼 나아간 투명도를 구한다.
인자 : number fromOpacity -> 시작 투명도
number progress -> 0과 1 사이의 이동 진행률
반환값 : 현재 투명도
*/
const getOpacityAt = (fromOpacity: number, progress: number) =>
  fromOpacity + (1 - fromOpacity) * progress;

/*
함수 이름 : getTransitionNodes
기능 : 시작 모습과 목표 사이의 진행률만큼 옮긴 노드 목록을 만든다. 시작 모습이 없거나 변하지 않는 노드는 객체를 그대로 재사용해 다시 그리지 않는다.
인자 : CustomEditorNode[] nodes -> 목표 좌표를 가진 노드 목록
NodeFrames fromFrames -> 시작 모습
number progress -> 0과 1 사이의 이동 진행률
반환값 : 화면에 그릴 모습을 담은 노드 목록
*/
export const getTransitionNodes = (
  nodes: CustomEditorNode[],
  fromFrames: NodeFrames,
  progress: number,
): CustomEditorNode[] =>
  nodes.map((node) => {
    const from = fromFrames.get(node.id);

    if (!from || !hasChangingNode([node], fromFrames)) return node;

    return {
      ...node,
      position: {
        x: from.position.x + (node.position.x - from.position.x) * progress,
        y: from.position.y + (node.position.y - from.position.y) * progress,
      },
      style:
        from.opacity < 1
          ? { ...node.style, opacity: getOpacityAt(from.opacity, progress) }
          : node.style,
      zIndex: from.opacity < 1 ? -1 : node.zIndex, // 부모 뒤에서 나오게 한다.
    };
  });

/*
함수 이름 : getTransitionEdges
기능 : 투명하게 출발한 노드로 들어가는 엣지를 그 노드와 같은 투명도로 만든다. 나머지 엣지는 객체를 그대로 재사용한다.
인자 : CustomEditorEdge[] edges -> 보이는 엣지 목록
NodeFrames fromFrames -> 시작 모습
number progress -> 0과 1 사이의 이동 진행률
반환값 : 화면에 그릴 엣지 목록
*/
export const getTransitionEdges = (
  edges: CustomEditorEdge[],
  fromFrames: NodeFrames,
  progress: number,
): CustomEditorEdge[] =>
  edges.map((edge) => {
    const fromOpacity = fromFrames.get(edge.target)?.opacity ?? 1;

    if (fromOpacity === 1) return edge;

    return {
      ...edge,
      style: { ...edge.style, opacity: getOpacityAt(fromOpacity, progress) },
    };
  });
