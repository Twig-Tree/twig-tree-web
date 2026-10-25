import type { TreeTag } from "@/src/entities/tree";
import { getNormalizedTagName } from "./getNormalizedTagName";

/*
함수 이름 : findTagByName
기능 : 입력한 이름과 같은 이름의 트리 태그를 찾는다. 같은 이름의 태그는 트리에 하나뿐이므로,
있으면 새로 만들지 않고 이 태그를 노드에 연결한다. 이름 비교 규칙은 getNormalizedTagName을 따른다.
인자 : TreeTag[] tags -> 트리 태그 목록
string name -> 사용자가 입력한 태그 이름
반환값 : 같은 이름의 태그, 없으면 undefined
*/
export const findTagByName = (
  tags: TreeTag[],
  name: string,
): TreeTag | undefined => {
  const normalizedName = getNormalizedTagName(name);

  if (normalizedName === "") return undefined;

  return tags.find((tag) => getNormalizedTagName(tag.name) === normalizedName);
};
