import type { Edge, Node } from "@xyflow/react";

export type LabNodeState =
  | "default"
  | "selected"
  | "highlighted"
  | "lecture"
  | "editing"
  | "loading"
  | "error"
  | "collapsed";

export type LabEdgeState = "default" | "active" | "traced";

export type LabTheme = "neutral" | "soft" | "contrast";
export type LabDensity = "comfortable" | "compact";
export type LabViewport = "desktop" | "compact";

export type WorkspaceLabNodeData = {
  label: string;
  description?: string;
  state?: LabNodeState;
  isRoot?: boolean;
  hasChildren?: boolean;
};

export type WorkspaceLabEdgeData = {
  state?: LabEdgeState;
};

export type WorkspaceLabNode = Node<WorkspaceLabNodeData, "workspaceLab">;
export type WorkspaceLabEdge = Edge<WorkspaceLabEdgeData, "workspaceLab">;

export type WorkspaceLabScenario = {
  id: "empty" | "balanced" | "deep" | "dense";
  label: string;
  description: string;
  nodes: WorkspaceLabNode[];
  edges: WorkspaceLabEdge[];
};
