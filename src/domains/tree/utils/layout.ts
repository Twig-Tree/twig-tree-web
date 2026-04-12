import { Position } from "@xyflow/react";
import { CustomEdgeType, CustomNodeType } from "@/src/domains/tree/types";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export const elkOptions = {
  "elk.algorithm": "layered", // 노드들을 층(layer)별로 나누어 배치하는 알고리즘
  "elk.layered.spacing.nodeNodeBetweenLayers": "100", // 층 사이의 간격
  "elk.spacing.nodeNode": "80", // 노드 간의 간격
};

export const getLayoutedElements = async (
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
  options: Record<string, string> = {},
): Promise<{ nodes: CustomNodeType[]; edges: CustomEdgeType[] }> => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";
  const graph: any = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node: CustomNodeType) => ({
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
      nodes: (layoutedGraph.children ?? []).map((node: any) => ({
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
