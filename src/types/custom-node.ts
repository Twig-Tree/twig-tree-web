import type { BuiltInEdge, BuiltInNode } from "@xyflow/react";

// Custom nodes
import { type CustomNode } from "@/src/components/CustomNode";

// Custom edges
import { type CustomEdge } from "@/src/components/CustomEdge";

export type CustomNodeType = BuiltInNode | CustomNode;
export type CustomEdgeType = BuiltInEdge | CustomEdge;
