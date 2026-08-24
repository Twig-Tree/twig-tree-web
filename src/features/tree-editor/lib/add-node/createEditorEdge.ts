import { CustomEditorEdge } from "../../model/types";

type CreateEditorEdgeParams = {
  sourceClientId: string; // 부모 노드의 편집기 노드 ID
  targetClientId: string; // 자식 노드의 편집기 노드 ID
};

export const createEditorEdge = ({
  sourceClientId,
  targetClientId,
}: CreateEditorEdgeParams): CustomEditorEdge => {
  return {
    id: `e-${sourceClientId}-${targetClientId}`,
    type: "smoothstep",
    source: sourceClientId,
    target: targetClientId,
  };
};
