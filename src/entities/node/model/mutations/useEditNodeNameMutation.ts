import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NodeDTO, treeQueryKeys } from "@/src/entities/tree";
import { nodeApi } from "@/src/entities/node/api/nodeApi";

interface EditNodeNameVariables {
  treeId: string; // 노드가 속한 트리 ID
  nodeId: string; // 제목을 수정할 노드 ID
  name: string; // 새로 저장할 노드 제목
}

/*
함수 이름 : useEditNodeNameMutation
기능 : 노드 제목 수정 API 요청을 수행하고, 요청이 완료되기 전에 트리 조회 캐시의 노드 이름을 낙관적으로 교체한다. 요청이 실패하면 이전 캐시로 되돌린다. 노드 이름은 별도 캐시를 두지 않고 트리 조회 캐시에 얹혀 있는 값을 갱신한다.
인자 : 없음
반환값 : 노드 제목 수정 mutation 객체
*/
export const useEditNodeNameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, nodeId, name }: EditNodeNameVariables) =>
      nodeApi.editNodeName(Number(treeId), Number(nodeId), { name }),

    /*
    서버 응답을 기다리기 전에 기존 트리 조회 요청을 취소하고,
    현재 캐시 데이터를 백업한 뒤 노드 이름을 먼저 교체한다.
    */
    onMutate: async ({ treeId, nodeId, name }) => {
      await queryClient.cancelQueries({
        queryKey: treeQueryKeys.detail(treeId),
      });

      const previousNodes = queryClient.getQueryData<NodeDTO[]>(
        treeQueryKeys.detail(treeId),
      );

      queryClient.setQueryData<NodeDTO[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.nodeId === Number(nodeId) ? { ...node, name } : node,
          ),
      );

      return { previousNodes };
    },

    /*
    서버가 이름을 보정할 수 있으므로 응답으로 받은 값을 캐시에 다시 반영한다.
    */
    onSuccess: (updatedNode, { treeId }) => {
      queryClient.setQueryData<NodeDTO[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.nodeId === updatedNode.nodeId ? updatedNode : node,
          ),
      );
    },

    /*
    요청이 실패하면 onMutate에서 백업한 이전 트리 데이터로 캐시를 복구한다.
    */
    onError: (_error, { treeId }, context) => {
      queryClient.setQueryData(
        treeQueryKeys.detail(treeId),
        context?.previousNodes,
      );
    },
  });
};
