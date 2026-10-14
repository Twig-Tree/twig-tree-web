import { useEffect, useMemo } from "react";
import { searchEditorNodes } from "../../lib/search/searchEditorNodes";
import { useHighlightStore } from "../highlight/highlightStore";
import { useTreeStore } from "../treeStore";

/*
함수 이름 : useNodeSearch
기능 : 검색어로 editor store의 전체 노드를 검색하고, 결과 노드를 캔버스에서 강조한다. 검색어가 비면 결과와 강조가 함께 사라진다.
지금은 서버 검색 API가 없어 editor store의 노드를 프론트에서 직접 검색한다. API를 붙일 때는 결과를 만드는 부분만 바꾼다.
인자 : string keyword -> 사용자가 입력한 검색어
반환값 : 검색 결과 목록과 검색어가 있는지 여부
*/
export const useNodeSearch = (keyword: string) => {
  const nodes = useTreeStore((state) => state.nodes);
  const setHighlight = useHighlightStore((state) => state.setHighlight);

  const hasKeyword = keyword.trim() !== "";

  /*
  접혀서 숨겨진 노드도 찾아야 하므로 화면에 보이는 노드가 아니라 store의 전체 노드를 검색한다.
  */
  const results = useMemo(
    () => searchEditorNodes(nodes, keyword),
    [nodes, keyword],
  );

  /*
  결과가 바뀔 때마다 강조 집합을 결과 노드로 교체한다. 검색어가 비면 결과가 빈 배열이라 강조도 함께 지워진다.
  강조 store는 결과를 그리는 노드들이 구독하므로, 결과를 페이지 아래로 props로 넘기는 대신 여기서 store에 반영한다.
  */
  useEffect(() => {
    setHighlight(results.map((result) => result.clientId));
  }, [results, setHighlight]);

  return { results, hasKeyword };
};
