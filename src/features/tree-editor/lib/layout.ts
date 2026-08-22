import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";
import { Position } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export const elkOptions = {
  "elk.algorithm": "layered", // 노드들을 층(layer)별로 나누어 배치하는 알고리즘
  "elk.layered.spacing.nodeNodeBetweenLayers": "100", // 층 사이의 간격
  "elk.spacing.nodeNode": "80", // 노드 간의 간격
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES", // 모델 데이터의 인덱스 순서 유지
};

// ELK 레이아웃을 적용하여 노드와 엣지의 위치를 계산하는 함수
export const getLayoutedElements = async (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  options: Record<string, string> = {},
): Promise<{ nodes: CustomEditorNode[]; edges: CustomEditorEdge[] }> => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";
  const graph = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node: CustomEditorNode) => ({
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      width: 150,
      height: 50,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  return elk
    .layout(graph)
    .then((layoutedGraph) => ({
      nodes: (layoutedGraph.children ?? []).map((node) => ({
        // ELK에서 반환한 node의 x, y 좌표 직접 참조
        ...node,
        position: { x: node.x ?? 0, y: node.y ?? 0 },
      })),
      edges: layoutedGraph.edges,
    }))
    .catch((err) => {
      console.error(err);
      return { nodes, edges };
    });
};

/*
함수 이름 : mergeLayoutPositions
기능 : ELK 계산 결과에서 position만 현재 노드 목록에 병합한다. 계산 결과 배열로 노드를 통째로 교체하면 계산이 도는 동안 store에 일어난 ID 교체·라벨 수정·추가·삭제가 덮이므로, 좌표만 얹는다.
인자 : CustomEditorNode[] currentNodes -> 병합 시점의 editor store 노드 목록
CustomEditorNode[] layoutedNodes -> ELK가 좌표를 계산한 노드 목록
반환값 : position만 갱신된 노드 목록
*/
export const mergeLayoutPositions = (
  currentNodes: CustomEditorNode[],
  layoutedNodes: CustomEditorNode[],
): CustomEditorNode[] => {
  const positionById = new Map(
    layoutedNodes.map((node) => [node.id, node.position]),
  );

  return currentNodes.map((node) => {
    const layoutedPosition = positionById.get(node.id);

    /*
    계산 시작 이후 추가되었거나 임시 ID가 실제 ID로 교체된 노드는 계산 결과에 없다.
    이런 노드는 다음 레이아웃 실행이 좌표를 잡을 때까지 현재 위치를 유지한다.
    */
    if (!layoutedPosition) return node;

    // 좌표가 그대로면 노드 객체를 재사용해 불필요한 리렌더를 막는다.
    if (
      node.position.x === layoutedPosition.x &&
      node.position.y === layoutedPosition.y
    ) {
      return node;
    }

    return { ...node, position: layoutedPosition };
  });
};
