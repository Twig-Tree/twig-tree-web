import { useMemo } from "react";
import { searchEditorNodes } from "../../lib/search/searchEditorNodes";
import { useTreeStore } from "../treeStore";

/*
함수 이름 : useNodeSearch
기능 : 검색어로 editor store의 전체 노드를 검색해 결과 목록을 만든다. 검색어가 비면 결과도 비어 있다.
지금은 서버 검색 API가 없어 editor store의 노드를 프론트에서 직접 검색한다. API를 붙일 때는 결과를 만드는 부분만 바꾼다.
결과를 강조하는 일은 useHighlightResults가 맡는다. 검색과 태그가 결과 영역을 번갈아 쓰므로, 지금 보이는 쪽의 결과만 강조해야 한다.
인자 : string keyword -> 사용자가 입력한 검색어
반환값 : 검색 결과 목록과 검색어가 있는지 여부
*/
export const useNodeSearch = (keyword: string) => {
  const nodes = useTreeStore((state) => state.nodes);

  const hasKeyword = keyword.trim() !== "";

  /*
  접혀서 숨겨진 노드도 찾아야 하므로 화면에 보이는 노드가 아니라 store의 전체 노드를 검색한다.
  */
  const results = useMemo(
    () => searchEditorNodes(nodes, keyword),
    [nodes, keyword],
  );

  return { results, hasKeyword };
};
