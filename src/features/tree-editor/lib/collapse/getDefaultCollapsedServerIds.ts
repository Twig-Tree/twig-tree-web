import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getChildClientIdsByParent } from "./getChildClientIdsByParent";

/*
함수 이름 : getDefaultCollapsedServerIds
기능 : 저장된 접힘 상태가 없는 트리에 적용할 기본 접힘 목록을 만든다. 루트를 깊이 0으로 셀 때 깊이가 expandedDepth인 노드 중 자식이 있는 노드를 접어, 깊이 expandedDepth까지만 보이게 한다.
인자 : CustomEditorNode[] nodes -> 현재 editor store의 노드 목록
CustomEditorEdge[] edges -> 현재 editor store의 엣지 목록
number expandedDepth -> 펼쳐 둘 마지막 깊이
반환값 : 접을 노드의 serverId 배열
*/
export const getDefaultCollapsedServerIds = (
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
  expandedDepth: number,
): string[] => {
  const childClientIdsByParent = getChildClientIdsByParent(edges);
  const childClientIds = new Set(edges.map((edge) => edge.target));
  const nodeByClientId = new Map(nodes.map((node) => [node.id, node]));

  /*
  들어오는 엣지가 없는 노드를 루트로 보고, 같은 깊이의 노드를 한 층씩 내려간다.
  */
  let currentDepthClientIds = nodes
    .filter((node) => !childClientIds.has(node.id))
    .map((node) => node.id);

  for (let depth = 0; depth < expandedDepth; depth += 1) {
    currentDepthClientIds = currentDepthClientIds.flatMap(
      (clientId) => childClientIdsByParent.get(clientId) ?? [],
    );
  }

  /*
  자식이 없는 노드는 접어도 숨길 것이 없으므로 목록에 넣지 않는다.
  serverId가 null인 노드는 저장할 키가 없고, 자식을 가질 수도 없어 접을 대상이 아니다.
  */
  return currentDepthClientIds.flatMap((clientId) => {
    const serverId = nodeByClientId.get(clientId)?.data.serverId ?? null;
    const hasChildren = (childClientIdsByParent.get(clientId)?.length ?? 0) > 0;

    return serverId !== null && hasChildren ? [serverId] : [];
  });
};
