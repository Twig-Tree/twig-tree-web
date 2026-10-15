export { sampleLearningPath } from "./mock/sampleLearningPath";
export { useLearningProgressStore } from "./model/learningProgressStore";
export {
  getLearningCheckpointStatus,
  getMainPathProgress,
  getRecommendedNextCheckpoint,
} from "./lib/progress";
export type {
  LearningCheckpoint,
  LearningCheckpointKind,
  LearningCheckpointStatus,
  LearningPath,
  LearningProgress,
  MainPathProgress,
} from "./model/types";
