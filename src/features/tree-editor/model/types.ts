import { type Node, type Edge } from "@xyflow/react";
import { TreeNodeData } from "@/src/entities/tree/model/types";

// TreeNodeData 사용 이유
// React Flow 기본 속성(id, position 등)과의 데이터 중복을 방지하고 순수 비즈니스 데이터만 주입하기 위함
export type CustomEditorNode = Node<TreeNodeData, "custom">;
export type CustomEditorEdge = Edge;
