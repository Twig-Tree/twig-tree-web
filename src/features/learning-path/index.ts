export { sampleLearningPath } from "./mock/sampleLearningPath";
export { useLearningProgressStore } from "./model/learningProgressStore";
export { LearningPathGraph } from "./ui/LearningPathGraph";
export { LearningSlidePanel } from "./ui/LearningSlidePanel";
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
