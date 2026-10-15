export type LearningCheckpointKind = "core" | "supplemental" | "advanced";

export interface LearningCheckpoint {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  kind: LearningCheckpointKind;
  prerequisiteIds: string[];
  sourceNodeIds: string[];
  recommendedNextId: string | null;
}

export interface LearningPath {
  id: string;
  version: number;
  title: string;
  checkpoints: LearningCheckpoint[];
}

export interface LearningProgress {
  activeCheckpointId: string | null;
  completedCheckpointIds: string[];
}

export type LearningCheckpointStatus =
  | "completed"
  | "current"
  | "available"
  | "locked";

export interface MainPathProgress {
  completed: number;
  total: number;
  percentage: number;
}
