import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memoApi } from "@/src/entities/tree/api/memoApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface DeleteMemoVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 메모를 삭제할 노드 ID
}

/*
함수 이름 : useDeleteMemoMutation
기능 : 노드 메모 삭제 API 요청을 수행하고, 성공 시 트리 조회 캐시에서 해당 노드의 memo를 null로 갱신한다.
인자 : DeleteMemoVariables
반환값 : 메모 삭제 mutation 객체
*/
export const useDeleteMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId }: DeleteMemoVariables) =>
      memoApi.deleteMemo(Number(nodeId)),

    onSuccess: (_data, { treeId, nodeId }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.id === nodeId ? { ...node, memo: null } : node,
          ),
      );
    },
  });
};
