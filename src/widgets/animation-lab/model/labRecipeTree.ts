import { type LectureRecipeTree } from "@/src/entities/lecture";
import { type TreeNode } from "@/src/entities/tree";

/*
함수 이름 : createLabRecipeTree
기능 : 고정 트리로 recipe가 읽는 트리 조회 창구를 만든다.
인자 : TreeNode[] tree -> 고정 트리
반환값 : 자식 목록과 조상→자손 경로를 찾는 함수
*/
export const createLabRecipeTree = (tree: TreeNode[]): LectureRecipeTree => {
  const parentIdById = new Map(tree.map((node) => [node.id, node.parentId]));

  return {
    getChildIds: (nodeId) =>
      tree
        .filter((node) => node.parentId === nodeId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((node) => node.id),
    getPathNodeIds: (ancestorNodeId, descendantNodeId) => {
      if (!parentIdById.has(descendantNodeId)) return null;

      const path = [descendantNodeId];

      while (path[0] !== ancestorNodeId) {
        const parentId = parentIdById.get(path[0]);
        if (parentId === null || parentId === undefined) return null;
        path.unshift(parentId);
      }

      return path;
    },
  };
};
