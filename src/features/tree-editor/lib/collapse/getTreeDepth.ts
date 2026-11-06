import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getChildClientIdsByParent } from "./getChildClientIdsByParent";

/*
함수 이름 : getTreeDepth
기능 : 넘긴 노드와 엣지에서 가장 깊은 노드의 깊이를 구한다. 전체 목록을 넘기면 트리의 최대 깊이를, 보이는 목록을 넘기면 지금 보이는 가장 깊은 곳을 구한다.
인자 : CustomEditorNode[] nodes -> 깊이를 잴 노드 목록
CustomEditorEdge[] edges -> 깊이를 잴 엣지 목록
반환값 : 루트를 0으로 센 가장 깊은 노드의 깊이. 노드가 없으면 0
*/
export const getTreeDepth = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
): number => {
  const childClientIdsByParent = getChildClientIdsByParent(edges);
  const childClientIds = new Set(edges.map((edge) => edge.target));
  const visitedClientIds = new Set<string>(); // 잘못된 구조에 순환이 있어도 계산이 끝나게 한다.

  let currentDepthClientIds = nodes
    .filter((node) => !childClientIds.has(node.id))
    .map((node) => node.id);
  let depth = -1;

  while (currentDepthClientIds.length > 0) {
    depth += 1;
    currentDepthClientIds.forEach((clientId) => visitedClientIds.add(clientId));
    currentDepthClientIds = currentDepthClientIds
      .flatMap((clientId) => childClientIdsByParent.get(clientId) ?? [])
      .filter((clientId) => !visitedClientIds.has(clientId));
  }

  return Math.max(depth, 0);
};
