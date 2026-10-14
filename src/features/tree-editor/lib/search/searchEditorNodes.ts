import { CustomEditorNode, NodeResult } from "../../model/types";

/*
함수 이름 : searchEditorNodes
기능 : 이름이나 메모에 검색어가 들어 있는 노드를 노드 배열 순서대로 모은다. 대소문자는 무시한다.
접혀서 숨겨진 노드도 찾아야 하므로 화면에 보이는 노드가 아니라 editor store의 전체 노드를 받는다.
인자 : CustomEditorNode[] nodes -> editor store의 전체 노드 목록
string keyword -> 사용자가 입력한 검색어. 앞뒤 공백은 지우고 비교한다
반환값 : 일치한 노드의 결과 목록. 검색어가 비어 있으면 빈 배열
*/
export const searchEditorNodes = (
  nodes: CustomEditorNode[],
  keyword: string,
): NodeResult[] => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (normalizedKeyword === "") return [];

  return nodes.flatMap((node) => {
    const isLabelMatched = node.data.label
      .toLowerCase()
      .includes(normalizedKeyword);
    const isMemoMatched =
      node.data.memo !== null &&
      node.data.memo.toLowerCase().includes(normalizedKeyword);

    if (!isLabelMatched && !isMemoMatched) return [];

    return [{ clientId: node.id, label: node.data.label, isMemoMatched }];
  });
};
