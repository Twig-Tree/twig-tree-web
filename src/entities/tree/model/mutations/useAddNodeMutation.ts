import { treeApi } from "@/src/entities/tree/api/treeApi";
import {
  CreateNodeRequest,
  NodeDTO,
  TreeDTO,
} from "@/src/entities/tree/api/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/*
함수 이름 : useAddNodeMutation
기능 : 노드 추가 API 요청을 수행하고, 요청이 완료되기 전에 React Query 캐시에 임시 노드를 추가하여 낙관적 업데이트를 처리한다.
인자 : 없음
반환값 : 노드 추가 mutation 객체
*/
export const useAddNodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    /*
    서버에 노드 추가 요청을 보낸다.
    */
    mutationFn: (params: { treeId: string; node: CreateNodeRequest }) => {
      return treeApi.createNode(params.treeId, params.node);
    },

    /*
    서버 응답을 기다리기 전에 기존 트리 조회 요청을 취소하고,
    현재 캐시 데이터를 백업한 뒤 임시 노드를 캐시에 추가한다.
    */
    onMutate: async ({ treeId, node }) => {
      await queryClient.cancelQueries({
        queryKey: treeQueryKeys.detail(treeId),
      });

      const previousTree = queryClient.getQueryData<TreeDTO>(
        treeQueryKeys.detail(treeId),
      );

      /*
      기존 트리 캐시에 임시 노드를 추가하여 화면에 먼저 반영한다.
      */
      queryClient.setQueryData<TreeDTO>(
        treeQueryKeys.detail(treeId),
        (oldTree) => {
          if (!oldTree) return oldTree;

          const optimisticNode: NodeDTO = {
            nodeId: Date.now(), // 임시 ID를 생성한다.
            name: node.name,
            parentId: node.parentId,
            orderId: node.orderId,
            memo: null,
          };

          return {
            ...oldTree,
            nodes: [...oldTree.nodes, optimisticNode],
          };
        },
      );

      return { previousTree };
    },

    /*
    노드 추가 요청이 실패하면 onMutate에서 백업한 이전 트리 데이터로 캐시를 복구한다.
    */
    onError: (_error, variables, context) => {
      queryClient.setQueryData(
        treeQueryKeys.detail(variables.treeId),
        context?.previousTree,
      );
    },

    /*
    노드 추가 요청이 성공하거나 실패한 뒤 서버의 최신 트리 데이터를 다시 조회한다.
    */
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: treeQueryKeys.detail(variables.treeId),
      });
    },
  });
};
