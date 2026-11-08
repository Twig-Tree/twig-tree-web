import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memoApi } from "@/src/entities/tree/api/memoApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface DeleteMemoVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 메모를 삭제할 노드 ID
  version: number; // 화면이 알고 있는 노드 version
}

/*
함수 이름 : useDeleteMemoMutation
기능 : 노드 메모 삭제 API 요청을 수행하고, 성공 시 트리 조회 캐시에서 해당 노드의 memo를 null로, version을 삭제 후 값으로 갱신한다.
인자 : DeleteMemoVariables
반환값 : 삭제 후 노드 version을 돌려주는 메모 삭제 mutation 객체
*/
export const useDeleteMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: treeQueryKeys.mutations(),
    /*
    삭제 응답에는 본문이 없어 version을 직접 계산한다. 메모가 있을 때만 삭제를 보내므로
    성공했다면 memo 컬럼이 바뀌었고, 서버의 version은 정확히 1 올랐다.
    */
    mutationFn: async ({ nodeId, version }: DeleteMemoVariables) => {
      await memoApi.deleteMemo(Number(nodeId), version);

      return version + 1;
    },

    onSuccess: (nextVersion, { treeId, nodeId }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.id === nodeId
              ? { ...node, memo: null, version: nextVersion }
              : node,
          ),
      );
    },
  });
};
