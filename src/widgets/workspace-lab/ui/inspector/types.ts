import type {
  WorkspaceLabConfig,
  WorkspaceLabConfigChange,
} from "../../model/config";

export type InspectorSectionProps = {
  config: WorkspaceLabConfig; // 현재 실험 조합
  onChange: (change: WorkspaceLabConfigChange) => void;
};
