import { useMutation, useQueryClient } from "@tanstack/react-query";
import { treeApi } from "@/src/entities/tree/api/treeApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface MoveNodeVariables {
  treeId: string; // 노드가 속한 트리 ID
  nodeId: string; // 옮길 노드 ID
  parentId: string; // 목적지 부모 노드 ID. 같은 부모 안에서 순서만 바꿀 때도 현재 부모를 넘긴다
  position: number; // 목적지 부모 밑에서의 순번. 1부터 센다
}

/*
함수 이름 : useMoveNodeMutation
기능 : 노드 이동 API 요청을 수행하고, 서버가 다시 매긴 형제 노드들로 트리 조회 캐시를 갱신한다.
인자 : 없음
반환값 : 노드 이동 mutation 객체
*/
export const useMoveNodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, nodeId, parentId, position }: MoveNodeVariables) =>
      treeApi.moveNode(Number(treeId), Number(nodeId), {
        parentId: Number(parentId),
        position,
      }),

    /*
    이동은 옮긴 노드의 parentId와 양쪽 형제의 orderIndex를 함께 바꾼다. 응답에 바뀐 노드가 모두 들어 있으므로
    무효화하지 않고 응답 노드로 캐시를 덮는다. 하위 노드는 parentId가 그대로라 바뀌지 않는다.
    캐시에 없는 노드는 다른 곳에서 만든 노드이므로 끝에 덧붙인다. 캐시는 배열 순서를 약속하지 않는다.
    */
    onSuccess: ({ siblings, previousSiblings }, { treeId }) => {
      const movedNodeById = new Map(
        [...siblings, ...previousSiblings].map((node) => [node.id, node]),
      );

      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) => {
          if (!oldNodes) return oldNodes;

          const oldNodeIds = new Set(oldNodes.map((node) => node.id));
          const addedNodes = [...movedNodeById.values()].filter(
            (node) => !oldNodeIds.has(node.id),
          );

          return [
            ...oldNodes.map((node) => movedNodeById.get(node.id) ?? node),
            ...addedNodes,
          ];
        },
      );
    },
  });
};
