import { CustomEditorEdge, CustomEditorNode } from "../../model/types";
import { getCollapsedServerIdsAtDepth } from "./getCollapsedServerIdsAtDepth";
import { getHiddenClientIds } from "./getHiddenClientIds";

type HasVisibleNodeChangeParams = {
  nodes: CustomEditorNode[]; // editor store의 전체 노드 목록
  edges: CustomEditorEdge[]; // editor store의 전체 엣지 목록
  visibleNodes: CustomEditorNode[]; // 지금 보이는 노드 목록
  expandedDepth: number; // 펼쳐 둘 마지막 깊이
};

/*
함수 이름 : hasVisibleNodeChange
기능 : 트리를 정해진 깊이까지만 보여 주면 보이는 노드가 달라지는지 확인한다. 접을 노드에 서버 ID가 아직 없으면 접히지 않아 그대로일 수 있다.
인자 : HasVisibleNodeChangeParams
반환값 : 보이는 노드가 달라지면 true
*/
export const hasVisibleNodeChange = ({
  nodes,
  edges,
  visibleNodes,
  expandedDepth,
}: HasVisibleNodeChangeParams): boolean => {
  const nextHiddenClientIds = getHiddenClientIds(
    nodes,
    edges,
    new Set(getCollapsedServerIdsAtDepth(nodes, edges, expandedDepth)),
  );

  return (
    visibleNodes.length !== nodes.length - nextHiddenClientIds.size ||
    visibleNodes.some((node) => nextHiddenClientIds.has(node.id))
  );
};
