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
