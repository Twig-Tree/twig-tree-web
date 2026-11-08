import { TreeNode } from "@/src/entities/tree";

/*
함수 이름 : isSameTagIds
기능 : 두 태그 ID 목록이 같은 태그들을 담고 있는지 순서와 무관하게 판단한다. 태그를 붙이면 캐시는 끝에 덧붙이므로 서버의 순서와 다를 수 있다.
인자 : string[] tagIds -> 비교할 태그 ID 목록
string[] otherTagIds -> 비교할 다른 태그 ID 목록
반환값 : 같은 태그들이면 true
*/
const isSameTagIds = (tagIds: string[], otherTagIds: string[]): boolean => {
  if (tagIds.length !== otherTagIds.length) return false;

  const otherTagIdSet = new Set(otherTagIds);

  return tagIds.every((tagId) => otherTagIdSet.has(tagId));
};

/*
함수 이름 : isSameTreeNodes
기능 : 두 트리 조회 결과가 같은 내용인지 판단한다. 캐시는 노드 순서를 약속하지 않으므로 배열 순서는 보지 않는다.
version도 함께 본다. 다른 곳에서 내용을 바꿨다가 되돌리면 내용은 같아도 version이 달라, 놓치면 다음 저장이 잘못 충돌한다.
인자 : TreeNode[] nodes -> 비교할 노드 목록
TreeNode[] otherNodes -> 비교할 다른 노드 목록
반환값 : 같은 내용이면 true
*/
export const isSameTreeNodes = (
  nodes: TreeNode[],
  otherNodes: TreeNode[],
): boolean => {
  if (nodes.length !== otherNodes.length) return false;

  const otherNodeById = new Map(otherNodes.map((node) => [node.id, node]));

  return nodes.every((node) => {
    const otherNode = otherNodeById.get(node.id);

    return (
      otherNode !== undefined &&
      node.parentId === otherNode.parentId &&
      node.label === otherNode.label &&
      node.orderIndex === otherNode.orderIndex &&
      node.memo === otherNode.memo &&
      node.version === otherNode.version &&
      isSameTagIds(node.tagIds, otherNode.tagIds)
    );
  });
};
