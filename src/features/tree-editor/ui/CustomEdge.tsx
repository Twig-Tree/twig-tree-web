import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";
import { getStraightPath, BaseEdge, type EdgeProps } from "@xyflow/react";
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
}: EdgeProps<CustomEditorEdge>) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const isTraced = useLectureAnimationStore((state) =>
    isLectureEdgeTraced(state, source, target),
  );

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={isTraced ? "lecture-edge-traced" : undefined}
    />
  );
}
