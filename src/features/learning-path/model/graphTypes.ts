import type { Edge, Node } from "@xyflow/react";
import type { LearningCheckpoint, LearningCheckpointStatus } from "./types";

export interface LearningCheckpointNodeData extends Record<string, unknown> {
  checkpoint: LearningCheckpoint;
  status: LearningCheckpointStatus;
  onSelect: (checkpointId: string) => void;
}

export type LearningCheckpointNode = Node<
  LearningCheckpointNodeData,
  "learningCheckpoint"
>;

export interface LearningPathEdgeData extends Record<string, unknown> {
  isOptional: boolean;
}

export type LearningPathEdge = Edge<LearningPathEdgeData>;

export interface LearningPathGraphElements {
  nodes: LearningCheckpointNode[];
  edges: LearningPathEdge[];
}
