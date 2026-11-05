import { getTreeDepth } from "../../lib/collapse/getTreeDepth";
import { CustomEditorEdge, CustomEditorNode } from "../types";
import { useCollapseStore } from "./collapseStore";

type UseTreeLevelControlParams = {
  treeId: string | null; // 접힘 상태를 바꿀 트리 ID. 트리가 없으면 null
  nodes: CustomEditorNode[]; // editor store의 전체 노드 목록
  edges: CustomEditorEdge[]; // editor store의 전체 엣지 목록
  visibleNodes: CustomEditorNode[]; // 접힌 노드의 하위를 걸러 낸 노드 목록
  visibleEdges: CustomEditorEdge[]; // 접힌 노드의 하위를 걸러 낸 엣지 목록
};

/*
함수 이름 : useTreeLevelControl
기능 : 트리를 몇 계층까지 보여 줄지 한 단계씩 조절한다. 계층은 루트를 1로 세어 화면에 보여 주고, 깊이는 루트를 0으로 센다.
노드별로 접어 깊이가 가지마다 다르면 보이는 노드 중 가장 깊은 곳을 현재 계층으로 본다.
인자 : UseTreeLevelControlParams
반환값 : 현재 계층, 한 단계 접고 펼치는 함수, 각 버튼의 비활성 여부
*/
export const useTreeLevelControl = ({
  treeId,
  nodes,
  edges,
  visibleNodes,
  visibleEdges,
}: UseTreeLevelControlParams) => {
  const expandToDepth = useCollapseStore((state) => state.expandToDepth);

  const maxDepth = getTreeDepth(nodes, edges);
  const currentDepth = getTreeDepth(visibleNodes, visibleEdges);

  /*
  가장 깊은 가지가 보여도 다른 가지가 접혀 있을 수 있으므로, 숨겨진 노드가 있으면 펼칠 수 있다.
  */
  const hasHiddenNodes = visibleNodes.length < nodes.length;

  const changeDepth = (expandedDepth: number) => {
    if (treeId === null) return;

    expandToDepth({ treeId, nodes, edges, expandedDepth });
  };

  const handleCollapseLevel = () => changeDepth(currentDepth - 1);

  const handleExpandLevel = () =>
    changeDepth(Math.min(currentDepth + 1, maxDepth));

  return {
    treeLevel: treeId === null || nodes.length === 0 ? null : currentDepth + 1, // 접고 펼칠 트리가 없으면 null
    handleCollapseLevel,
    handleExpandLevel,
    isCollapseLevelDisabled: currentDepth === 0,
    isExpandLevelDisabled: currentDepth >= maxDepth && !hasHiddenNodes,
  };
};
