import { useEffect, useMemo } from "react";
import { getHiddenClientIds } from "../../lib/collapse/getHiddenClientIds";
import { useTreeStore } from "../treeStore";
import { CustomEditorEdge, CustomEditorNode } from "../types";
import { useCollapseStore } from "./collapseStore";

type UseVisibleElementsParams = {
  nodes: CustomEditorNode[]; // editor store의 전체 노드 목록
  edges: CustomEditorEdge[]; // editor store의 전체 엣지 목록
  onSelectedNodeHidden: () => void; // 선택된 노드가 접혀 숨겨졌을 때 페이지가 할 일. 메모 패널 닫기 등
};

/*
함수 이름 : useVisibleElements
기능 : 접힌 노드의 하위 노드를 걸러 내 화면에 그리고 레이아웃을 계산할 노드·엣지 배열을 만든다.
React Flow의 hidden 속성 대신 배열에서 걸러 내므로, 같은 배열을 레이아웃 계산과 화면 표시에 함께 넘길 수 있다.
선택된 노드가 숨겨지면 선택을 해제하고 onSelectedNodeHidden을 부른다.
인자 : UseVisibleElementsParams
반환값 : 보이는 노드 배열과 보이는 엣지 배열
*/
export const useVisibleElements = ({
  nodes,
  edges,
  onSelectedNodeHidden,
}: UseVisibleElementsParams) => {
  const collapsedServerIds = useCollapseStore(
    (state) => state.collapsedServerIds,
  );

  const hiddenClientIds = useMemo(
    () => getHiddenClientIds(nodes, edges, collapsedServerIds),
    [nodes, edges, collapsedServerIds],
  );

  /*
  선택된 노드는 editor store에서 selected로 찾으므로 화면에서 숨겨져도 선택된 채로 남는다.
  그대로 두면 Delete Node와 Add Node가 보이지 않는 노드를 대상으로 동작하고, 메모 패널이 보이지 않는 노드의 메모를 보여 준다.
  이 탭의 토글과 다른 탭에서 받은 접힘 변경 모두 숨길 노드 집합을 바꾸므로, 두 경우를 여기 한 곳에서 처리한다.
  selected만 바꾸고 노드·엣지 개수와 orderIndex는 그대로라 undo history에 기록되지 않는다.
  */
  useEffect(() => {
    const hasHiddenSelectedNode = nodes.some(
      (node) => node.selected && hiddenClientIds.has(node.id),
    );

    if (!hasHiddenSelectedNode) return;

    useTreeStore.setState((state) => ({
      nodes: state.nodes.map((node) =>
        node.selected && hiddenClientIds.has(node.id)
          ? { ...node, selected: false }
          : node,
      ),
    }));

    onSelectedNodeHidden();
  }, [nodes, hiddenClientIds, onSelectedNodeHidden]);

  return useMemo(() => {
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
  }, [nodes, edges, hiddenClientIds]);
};
