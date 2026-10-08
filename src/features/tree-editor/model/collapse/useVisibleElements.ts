import { useMemo } from "react";
import { getHiddenClientIds } from "../../lib/collapse/getHiddenClientIds";
import { CustomEditorEdge, CustomEditorNode } from "../types";
import { useCollapseStore } from "./collapseStore";

type UseVisibleElementsParams = {
  nodes: CustomEditorNode[]; // editor store의 전체 노드 목록
  edges: CustomEditorEdge[]; // editor store의 전체 엣지 목록
};

/*
함수 이름 : useVisibleElements
기능 : 접힌 노드의 하위 노드를 걸러 내 화면에 그리고 레이아웃을 계산할 노드·엣지 배열을 만든다.
React Flow의 hidden 속성 대신 배열에서 걸러 내므로, 같은 배열을 레이아웃 계산과 화면 표시에 함께 넘길 수 있다.
인자 : UseVisibleElementsParams
반환값 : 보이는 노드 배열과 보이는 엣지 배열
*/
export const useVisibleElements = ({
  nodes,
  edges,
}: UseVisibleElementsParams) => {
  const collapsedServerIds = useCollapseStore(
    (state) => state.collapsedServerIds,
  );

  return useMemo(() => {
    const hiddenClientIds = getHiddenClientIds(
      nodes,
      edges,
      collapsedServerIds,
    );

    /*
    숨길 노드가 없으면 store의 배열을 그대로 돌려준다. 새 배열을 만들면 React Flow가 매번 바뀐 배열로 받는다.
    */
    if (hiddenClientIds.size === 0) {
      return { visibleNodes: nodes, visibleEdges: edges };
    }

    /*
    엣지는 양 끝 노드가 모두 보일 때만 남긴다. 한쪽 끝이 걸러진 엣지를 넘기면 React Flow와 ELK가
    없는 노드를 가리키는 엣지를 받는다.
    */
    return {
      visibleNodes: nodes.filter((node) => !hiddenClientIds.has(node.id)),
      visibleEdges: edges.filter(
        (edge) =>
          !hiddenClientIds.has(edge.source) &&
          !hiddenClientIds.has(edge.target),
      ),
    };
  }, [nodes, edges, collapsedServerIds]);
};
