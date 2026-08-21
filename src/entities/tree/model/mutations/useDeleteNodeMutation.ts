import { treeApi } from "@/src/entities/tree/api/treeApi";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteNodeVariables {
  treeId: string; // 노드가 속한 트리 ID
  nodeId: string; // 삭제할 노드 ID
}

/*
함수 이름 : useDeleteNodeMutation
기능 : 노드 삭제 API 요청을 수행하고, 성공 시 트리 조회 캐시를 무효화해 서버 상태와 다시 맞춘다.
인자 : 없음
반환값 : 노드 삭제 mutation 객체
*/
export const useDeleteNodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, nodeId }: DeleteNodeVariables) =>
      treeApi.deleteNode(Number(treeId), Number(nodeId)),

    /*
    삭제는 응답 본문이 없고 지워진 서브트리 범위를 캐시에서 다시 계산해야 하므로,
    직접 패치하는 대신 재조회로 서버 상태와 맞춘다.
    실패한 경우에는 캐시를 건드린 적이 없어 재조회할 이유가 없으므로 onSettled에 두지 않는다.
    */
    onSuccess: (_data, { treeId }) => {
      queryClient.invalidateQueries({
        queryKey: treeQueryKeys.detail(treeId),
      });
    },
  });
};
