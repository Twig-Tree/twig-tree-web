import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";
import { getSmoothStepPath, BaseEdge, type EdgeProps } from "@xyflow/react";
import {
  isLectureEdgeTraced,
  useLectureAnimationStore,
} from "@/src/features/tree-editor/model/lecture/lectureAnimationStore";

export function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerStart,
  markerEnd,
  interactionWidth,
  style,
}: EdgeProps<CustomEditorEdge>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const isTraced = useLectureAnimationStore((state) =>
    isLectureEdgeTraced(state, source, target),
  );

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
      style={style}
      className={isTraced ? "lecture-edge-traced" : undefined}
    />
  );
}
