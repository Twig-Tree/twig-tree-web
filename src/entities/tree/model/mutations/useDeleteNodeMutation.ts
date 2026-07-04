import { treeApi } from "@/src/entities/tree/api/treeApi";
import { NodeDTO } from "@/src/entities/tree/api/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/*
함수 이름 : useDeleteNodeMutation
기능 : 노드 삭제 API 요청을 수행하고, 요청이 완료되기 전에 React Query 캐시에서 노드를 포함한 서브트리를 제거하여 낙관적 업데이트를 처리한다.
인자: 없음
반환값 : 노드 삭제 mutation 객체
*/
export const useDeleteNodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    /*
    서버에 노드 삭제 요청을 보낸다.
    */
    mutationFn: (params: { treeId: string; nodeId: string }) => {
      return treeApi.deleteNode(params.treeId, params.nodeId);
    },

    /*
    서버 응답을 기다리기 전에 기존 트리 조회 요청을 취소하고,
    현재 캐시 데이터를 백업한 뒤 노드를 캐시에서 제거한다.
    */
    onMutate: async ({ treeId, nodeId }) => {
      await queryClient.cancelQueries({
        queryKey: treeQueryKeys.detail(treeId),
      });

      const previousNodes = queryClient.getQueryData<NodeDTO[]>(
        treeQueryKeys.detail(treeId),
      );

      /*
      기존 트리 캐시에서 노드를 포함한 서브트리를 삭제하여 화면에 먼저 반영한다.
      */
      queryClient.setQueryData<NodeDTO[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) => {
          if (!oldNodes) return oldNodes;

          const idsToDelete = new Set<number>([Number(nodeId)]);
          const queue = [Number(nodeId)];

          while (queue.length > 0) {
            const currentId = queue.shift()!;

            oldNodes.forEach((node) => {
              if (node.parentId === currentId) {
                idsToDelete.add(node.nodeId);
                queue.push(node.nodeId);
              }
            });
          }

          return oldNodes.filter((node) => !idsToDelete.has(node.nodeId));
        },
      );

      return { previousNodes };
    },

    /*
    노드 삭제 요청이 실패하면 onMutate에서 백업한 이전 트리 데이터로 캐시를 복구한다.
    */
    onError: (_error, variables, context) => {
      queryClient.setQueryData<NodeDTO[]>(
        treeQueryKeys.detail(variables.treeId),
        context?.previousNodes,
      );
    },
  });
};
