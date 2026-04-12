import { CustomEdgeType } from "../types";

export const isDuplicateEdge = (
  edges: CustomEdgeType[],
  source: string,
  target: string,
  excludeId?: string,
) => {
  return edges.some(
    (edge) =>
      edge.id !== excludeId && edge.source === source && edge.target === target,
  );
};
