import { useMemo } from "react";
import { getTaggedNodeResults } from "../../lib/tag/getTaggedNodeResults";
import { useTreeStore } from "../treeStore";
import { NodeResult } from "../types";

const EMPTY_RESULTS: NodeResult[] = []; // 태그를 고르지 않았을 때 렌더마다 새 배열이 되면 강조 effect가 매번 다시 돈다.

/*
함수 이름 : useTagResults
기능 : 고른 트리 태그가 붙은 노드를 editor store의 전체 노드에서 찾아 결과 목록을 만든다.
노드에 태그를 붙이거나 떼면 store가 바뀌므로 결과도 따라 바뀐다.
인자 : string | null tagId -> 고른 트리 태그 ID, 고르지 않았으면 null
반환값 : 태그가 붙은 노드의 결과 목록
*/
export const useTagResults = (tagId: string | null) => {
  const nodes = useTreeStore((state) => state.nodes);

  return useMemo(
    () => (tagId === null ? EMPTY_RESULTS : getTaggedNodeResults(nodes, tagId)),
    [nodes, tagId],
  );
};
