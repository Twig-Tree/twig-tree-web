import { type XYPosition } from "@xyflow/react";
import { CustomEditorNode } from "../../model/types";

export type NodePositions = ReadonlyMap<string, XYPosition>; // 노드 ID별 좌표

/*
함수 이름 : getNodePositions
기능 : 노드 목록에서 ID별 좌표를 모은다.
인자 : CustomEditorNode[] nodes -> 좌표를 모을 노드 목록
반환값 : 노드 ID별 좌표
*/
export const getNodePositions = (nodes: CustomEditorNode[]): NodePositions =>
  new Map(nodes.map((node) => [node.id, node.position]));

/*
함수 이름 : hasMovedNode
기능 : 시작 좌표가 있는 노드 중 목표 좌표와 다른 노드가 있는지 확인한다. 시작 좌표가 없는 노드는 옮길 수 없으므로 보지 않는다.
인자 : CustomEditorNode[] nodes -> 목표 좌표를 가진 노드 목록
NodePositions fromPositions -> 시작 좌표
반환값 : 움직일 노드가 있으면 true
*/
export const hasMovedNode = (
  nodes: CustomEditorNode[],
  fromPositions: NodePositions,
): boolean =>
  nodes.some((node) => {
    const from = fromPositions.get(node.id);

    return (
      from !== undefined &&
      (from.x !== node.position.x || from.y !== node.position.y)
    );
  });

/*
함수 이름 : getTransitionNodes
기능 : 시작 좌표와 목표 좌표 사이의 진행률만큼 옮긴 노드 목록을 만든다. 시작 좌표가 없거나 움직이지 않는 노드는 객체를 그대로 재사용해 다시 그리지 않는다.
인자 : CustomEditorNode[] nodes -> 목표 좌표를 가진 노드 목록
NodePositions fromPositions -> 시작 좌표
number progress -> 0과 1 사이의 이동 진행률
반환값 : 화면에 그릴 좌표를 담은 노드 목록
*/
export const getTransitionNodes = (
  nodes: CustomEditorNode[],
  fromPositions: NodePositions,
  progress: number,
): CustomEditorNode[] =>
  nodes.map((node) => {
    const from = fromPositions.get(node.id);

    if (!from || (from.x === node.position.x && from.y === node.position.y)) {
      return node;
    }

    return {
      ...node,
      position: {
        x: from.x + (node.position.x - from.x) * progress,
        y: from.y + (node.position.y - from.y) * progress,
      },
    };
  });
