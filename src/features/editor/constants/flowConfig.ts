import { CustomNode } from "@/src/features/editor/components/CustomNode";
import { CustomEdge } from "@/src/features/editor/components/CustomEdge";

export const nodeTypes = {
  custom: CustomNode,
};

export const edgeTypes = {
  custom: CustomEdge,
};

export type Direction = "RIGHT" | "DOWN";
