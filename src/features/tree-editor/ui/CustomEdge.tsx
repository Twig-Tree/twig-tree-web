import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";
import { getStraightPath, BaseEdge, type EdgeProps } from "@xyflow/react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<CustomEditorEdge>) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return <BaseEdge id={id} path={edgePath} />;
}
