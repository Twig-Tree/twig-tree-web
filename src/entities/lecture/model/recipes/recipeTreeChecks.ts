import { createRecipeFailure } from "./getLectureRecipeAnimation";
import { type LectureRecipeFailure, type LectureRecipeTree } from "./types";

/*
함수 이름 : getSelectedChildIds
기능 : 부모의 자식 중 recipe가 다룰 노드를 고른다. children을 주면 그 순서를 따르되 모두 parent의 자식이어야 하고,
없으면 parent의 모든 자식을 화면 순서로 쓴다.
인자 : string parent -> 부모 노드 ID
string[] | undefined children -> 입력으로 고른 자식
LectureRecipeTree tree -> 트리 조회 함수
string emptyMessage -> 다룰 자식이 없을 때의 실패 이유
반환값 : 자식 노드 ID 목록, 또는 입력 위치가 붙은 실패
*/
export const getSelectedChildIds = (
  parent: string,
  children: string[] | undefined,
  tree: LectureRecipeTree,
  emptyMessage: string,
): string[] | LectureRecipeFailure => {
  const childIds = tree.getChildIds(parent);

  if (children === undefined) {
    return childIds.length === 0
      ? createRecipeFailure(["parent"], emptyMessage)
      : childIds;
  }

  const strayIndex = children.findIndex(
    (childId) => !childIds.includes(childId),
  );

  return strayIndex === -1
    ? children
    : createRecipeFailure(
        ["children", strayIndex],
        "parent의 자식이 아닌 노드입니다.",
      );
};
