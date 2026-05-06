import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";

export const isDuplicateEdge = (
  edges: CustomEditorEdge[],
  source: string,
  target: string,
  excludeId?: string,
) => {
  return edges.some(
    (edge) =>
      edge.id !== excludeId && edge.source === source && edge.target === target,
  );
};
