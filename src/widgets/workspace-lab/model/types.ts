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

export type { WorkspaceLabThemeId as LabTheme } from "./themes";
export type { WorkspaceLabLayoutId as LabLayoutMode } from "./layouts";
export type { WorkspaceLabLayoutSpacingId as LabLayoutSpacing } from "./layouts";
export type { WorkspaceLabNodeShapeId as LabNodeShape } from "./node-shapes";
export type {
  WorkspaceLabEdgeColorId as LabEdgeColor,
  WorkspaceLabEdgeEffectId as LabEdgeEffect,
  WorkspaceLabEdgeLineStyleId as LabEdgeLineStyle,
  WorkspaceLabEdgeOpacityId as LabEdgeOpacity,
  WorkspaceLabEdgePatternId as LabEdgePattern,
  WorkspaceLabEdgeStyleSelection as LabEdgeStyle,
  WorkspaceLabEdgeThicknessId as LabEdgeThickness,
} from "./edge-styles";
export type {
  WorkspaceLabCanvasStyleId as LabCanvasStyle,
  WorkspaceLabCollapseControlStyleId as LabCollapseControlStyle,
  WorkspaceLabConnectionPointStyleId as LabConnectionPointStyle,
  WorkspaceLabNodeDensityId as LabDensity,
} from "./visual-slots";
export type LabViewport = "desktop" | "compact";

export type WorkspaceLabNodeData = {
  label: string;
  description?: string;
  state?: LabNodeState;
  isRoot?: boolean;
  hasChildren?: boolean;
  layoutMode?: "vertical" | "horizontal" | "radial";
  nodeShape?: "square" | "rounded" | "circle";
  connectionPointStyle?: "dot" | "ring" | "square" | "hidden";
  collapseControlStyle?: "floating" | "notch" | "minimal";
};

export type WorkspaceLabEdgeData = {
  state?: LabEdgeState;
  path?: "smoothstep" | "bezier";
  lineStyle?: "layout" | "straight" | "orthogonal" | "rounded" | "curved";
  pattern?: "solid" | "dashed" | "dotted";
  thickness?: "hairline" | "regular" | "strong";
  color?: "theme" | "accent" | "ink" | "highlight";
  opacity?: "full" | "muted" | "faint";
  effect?: "none" | "shadow" | "contrast" | "fade";
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
