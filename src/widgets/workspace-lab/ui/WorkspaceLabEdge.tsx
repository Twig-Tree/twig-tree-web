import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { WorkspaceLabEdge } from "../model/types";

export function WorkspaceLabEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<WorkspaceLabEdge>) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      className="workspace-lab-edge"
      data-state={data?.state ?? "default"}
    />
  );
}
