import { type LectureCompilerTree } from "./types";

/*
컴파일러가 읽는 트리 노드. 편집기 store, 시나리오 fixture처럼 모양이 다른 트리를 이 모양으로 옮겨 넘긴다.
*/
export type LectureCompilerTreeNode = {
  id: string; // 서버 노드 ID
  parentId: string | null; // 루트면 null
};

/*
함수 이름 : createLectureCompilerTree
기능 : 노드 목록으로 컴파일러가 읽는 트리 조회 함수를 만든다. 형제 순서는 목록 순서를 따른다.
인자 : LectureCompilerTreeNode[] nodes -> 형제끼리 화면 순서대로 놓인 노드 목록
반환값 : 노드 존재, 자식 목록, 조상→자손 경로를 찾는 함수
*/
export const createLectureCompilerTree = (
  nodes: LectureCompilerTreeNode[],
): LectureCompilerTree => {
  const parentIdById = new Map(nodes.map(({ id, parentId }) => [id, parentId]));
  const childIdsByParent = new Map<string, string[]>();

  /*
  목록에 없는 부모를 가리키는 노드는 그 부모의 자식으로 넣지 않는다. hasNode가 false인 노드에 자식이나 경로가 생기지 않게 하기 위해서다.
  */
  for (const { id, parentId } of nodes) {
    if (parentId === null || !parentIdById.has(parentId)) continue;
    childIdsByParent.set(parentId, [
      ...(childIdsByParent.get(parentId) ?? []),
      id,
    ]);
  }

  return {
    hasNode: (nodeId) => parentIdById.has(nodeId),
    getChildIds: (nodeId) => childIdsByParent.get(nodeId) ?? [],
    getPathNodeIds: (ancestorNodeId, descendantNodeId) => {
      if (!parentIdById.has(descendantNodeId)) return null;

      const path = [descendantNodeId];

      /*
      트리에 순환이 없다는 전제지만, 어긋난 데이터에서도 멈추도록 이미 지난 노드를 만나면 경로가 없다고 본다.
      */
      while (path[0] !== ancestorNodeId) {
        const parentId = parentIdById.get(path[0]);
        if (
          parentId === null ||
          parentId === undefined ||
          !parentIdById.has(parentId)
        ) {
          return null;
        }
        if (path.includes(parentId)) return null;
        path.unshift(parentId);
      }

      return path;
    },
  };
};
