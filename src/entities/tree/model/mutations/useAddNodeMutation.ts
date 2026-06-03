import { treeApi } from "@/src/entities/tree/api/treeApi";
import {
  CreateNodeRequest,
  NodeDTO,
  TreeDTO,
} from "@/src/entities/tree/api/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddNodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { treeId: string; node: CreateNodeRequest }) => {
      return treeApi.createNode(params.treeId, params.node);
    },

    onMutate: async ({ treeId, node }) => {
      await queryClient.cancelQueries({
        queryKey: treeQueryKeys.detail(treeId),
      });

      const previousTree = queryClient.getQueryData<TreeDTO>(
        treeQueryKeys.detail(treeId),
      );

      queryClient.setQueryData<TreeDTO>(["tree", treeId], (oldTree) => {
        if (!oldTree) return oldTree;

        const optimisticNode: NodeDTO = {
          nodeId: Date.now(), // 임시 ID, 실제로는 백엔드에서 생성된 ID를 사용해야 함
          name: node.name,
          parentId: node.parentId,
          orderId: node.orderId,
          memo: null,
        };

        return {
          ...oldTree,
          nodes: [...oldTree.nodes, optimisticNode],
        };
      });

      return { previousTree };
    },

    onError: (_error, variables, context) => {
      queryClient.setQueryData(
        treeQueryKeys.detail(variables.treeId),
        context?.previousTree,
      );
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: treeQueryKeys.detail(variables.treeId),
      });
    },
  });
};
