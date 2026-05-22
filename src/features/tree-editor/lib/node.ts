import {
  CustomEditorEdge,
  CustomEditorNode,
} from "@/src/features/tree-editor/model/types";

export const getNextOrderIndex = (
  parentId: string,
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): number => {
  const childNodeIds = edges
    .filter((edge) => edge.source === parentId)
    .map((edge) => edge.target);

  const maxOrderIndex = nodes
    .filter((node) => childNodeIds.includes(node.id))
    .reduce((max, node) => Math.max(max, node.data.orderIndex ?? 0), 0);

  return maxOrderIndex + 1;
};
