import { type Node, type Edge } from "@xyflow/react";
import { TreeNode } from "@/src/entities/tree/model/types";

// 트리 정렬 방향
export type Direction = "RIGHT" | "DOWN";

/*
편집기 노드는 React Flow의 Node 계약을 따른다. Node가 id·position 같은 화면 값을 최상위에 두고
나머지를 data에 담으므로, 도메인 노드에서 Node가 이미 소유하는 필드를 뺀 조각을 data에 싣는다.
id는 Node의 것이고, parentId는 편집기에서 엣지가 구조를 들고 있어 mapToVisualEdges가 소비한 뒤 버린다.
*/
export type EditorNodeData = Omit<TreeNode, "id" | "parentId">;

export type CustomEditorNode = Node<EditorNodeData, "custom">;
export type CustomEditorEdge = Edge;
