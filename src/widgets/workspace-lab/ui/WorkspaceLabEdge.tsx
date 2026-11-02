import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { WorkspaceLabEdge } from "../model/types";
import { workspaceLabSmoothStepRouting } from "../model/edge-routing";

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
  const pathParams = {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  };
  const [path] =
    data?.path === "bezier"
      ? getBezierPath(pathParams)
      : getSmoothStepPath({
          ...pathParams,
          borderRadius: workspaceLabSmoothStepRouting.borderRadius,
          offset: workspaceLabSmoothStepRouting.offset,
        });

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      className="workspace-lab-edge"
      data-state={data?.state ?? "default"}
      data-style={data?.edgeStyle ?? "fine"}
    />
  );
}
