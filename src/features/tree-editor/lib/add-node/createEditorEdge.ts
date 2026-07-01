import { CustomEditorEdge } from "../../model/types";

type CreateEditorEdgeParams = {
  sourceNodeId: string;
  targetNodeId: string;
};

export const createEditorEdge = ({
  sourceNodeId,
  targetNodeId,
}: CreateEditorEdgeParams): CustomEditorEdge => {
  return {
    id: `e-${sourceNodeId}-${targetNodeId}`,
    type: "smoothstep",
    source: sourceNodeId,
    target: targetNodeId,
  };
};
