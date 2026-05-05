import { BaseTreeEdge } from "@/src/domains/tree/types";

export const isDuplicateEdge = (
  edges: BaseTreeEdge[],
  source: string,
  target: string,
  excludeId?: string,
) => {
  return edges.some(
    (edge) =>
      edge.id !== excludeId && edge.source === source && edge.target === target,
  );
};
