import { CustomEditorNode, NodeResult } from "../../model/types";

/*
함수 이름 : getTaggedNodeResults
기능 : 태그가 붙은 노드를 노드 배열 순서대로 모아 결과 목록을 만든다.
접혀서 숨겨진 노드도 결과 목록에 보여야 하므로 화면에 보이는 노드가 아니라 editor store의 전체 노드를 받는다.
인자 : CustomEditorNode[] nodes -> editor store의 전체 노드 목록
string tagId -> 고른 트리 태그 ID
반환값 : 태그가 붙은 노드의 결과 목록. 태그 결과는 메모 일치가 아니므로 isMemoMatched는 항상 false
*/
export const getTaggedNodeResults = (
  nodes: CustomEditorNode[],
  tagId: string,
): NodeResult[] =>
  nodes.flatMap((node) =>
    node.data.tagIds.includes(tagId)
      ? [{ clientId: node.id, label: node.data.label, isMemoMatched: false }]
      : [],
  );
