import type { TreeTag } from "@/src/entities/tree";
import { getNormalizedTagName } from "./getNormalizedTagName";

/*
함수 이름 : getTagSuggestions
기능 : 노드 태그 입력의 자동완성 목록을 만든다. 이름에 입력값이 들어 있는 트리 태그를 트리 태그 목록 순서대로 모으고,
이미 노드에 붙은 태그는 뺀다. 입력값이 비어 있으면 붙지 않은 태그를 모두 보여 준다.
인자 : TreeTag[] tags -> 트리 태그 목록
string input -> 사용자가 입력 중인 값
string[] attachedTagIds -> 노드에 이미 붙은 태그 ID 목록
반환값 : 자동완성으로 보여 줄 태그 목록
*/
export const getTagSuggestions = (
  tags: TreeTag[],
  input: string,
  attachedTagIds: string[],
): TreeTag[] => {
  const normalizedInput = getNormalizedTagName(input);
  const attachedTagIdSet = new Set(attachedTagIds);

  return tags.filter(
    (tag) =>
      !attachedTagIdSet.has(tag.id) &&
      getNormalizedTagName(tag.name).includes(normalizedInput),
  );
};
