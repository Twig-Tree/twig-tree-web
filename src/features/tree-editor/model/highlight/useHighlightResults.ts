import { useEffect } from "react";
import { NodeResult } from "../types";
import { useHighlightStore } from "./highlightStore";

/*
함수 이름 : useHighlightResults
기능 : 결과 목록에 보이는 노드를 캔버스에서 강조한다. 결과가 바뀔 때마다 강조 집합을 결과 노드로 교체하고, 결과가 비면 강조도 지운다.
검색과 태그가 강조 집합 하나를 함께 쓰므로, 지금 보이는 결과를 이 hook 하나에만 넘긴다. 둘이 각자 강조를 쓰면 결과가 빈 쪽이 다른 쪽의 강조를 지운다.
인자 : NodeResult[] results -> 결과 목록에 보이는 노드
반환값 : 없음
*/
export const useHighlightResults = (results: NodeResult[]) => {
  const setHighlight = useHighlightStore((state) => state.setHighlight);

  /*
  강조 store는 결과를 그리는 노드들이 구독하므로, 결과를 페이지 아래로 props로 넘기는 대신 여기서 store에 반영한다.
  */
  useEffect(() => {
    setHighlight(results.map((result) => result.clientId));
  }, [results, setHighlight]);
};
