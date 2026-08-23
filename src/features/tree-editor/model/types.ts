import { type Node, type Edge } from "@xyflow/react";
import { TreeNode } from "@/src/entities/tree/model/types";

// 트리 정렬 방향
export type Direction = "RIGHT" | "DOWN";

/*
편집기 노드는 React Flow의 Node 계약을 따른다. Node가 id·position 같은 화면 값을 최상위에 두고
나머지를 data에 담으므로, 도메인 노드에서 Node가 이미 소유하는 필드를 뺀 조각을 data에 싣는다.
id는 Node의 것이고, parentId는 편집기에서 엣지가 구조를 들고 있어 mapToVisualEdges가 소비한 뒤 버린다.

편집기 안에는 노드를 가리키는 ID가 둘이므로 이름으로 구분한다. 편집기가 정하는 신원은 clientId,
서버가 확정한 ID는 serverId다. 예외는 Node.id 하나로, 이 이름은 React Flow가 소유한다.
Node.id에 담기는 값이 곧 clientId이며 엣지의 source·target도 같은 신원을 가리킨다.
entities는 노드를 가리키는 ID가 하나뿐이라 그대로 nodeId를 쓴다.
*/
export type EditorNodeData = Omit<TreeNode, "id" | "parentId"> & {
  /*
  서버가 확정한 노드 ID. 아직 서버에 저장되지 않은 노드는 null이다.
  도메인 ID를 Node.id가 아니라 data에 두어야 서버 전송 가능 여부를 노드 ID의 생김새가 아니라
  값의 유무로 판별할 수 있다.
  */
  serverId: string | null;
};

export type CustomEditorNode = Node<EditorNodeData, "custom">;
export type CustomEditorEdge = Edge;
