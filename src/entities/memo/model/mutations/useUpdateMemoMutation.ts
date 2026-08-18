import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memoApi } from "@/src/entities/memo/api/memoApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface UpdateMemoVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 메모를 저장할 노드 ID
  content: string; // 저장할 메모 내용
}

/*
함수 이름 : useUpdateMemoMutation
기능 : 노드 메모 생성/수정 API 요청을 수행하고, 성공 시 트리 조회 캐시에서 해당 노드의 memo를 갱신한다. 메모 자체는 별도 캐시를 두지 않고 트리 조회 캐시에 얹혀 있는 값을 갱신한다.
인자 : UpdateMemoVariables
반환값 : 메모 저장 mutation 객체
*/
export const useUpdateMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, content }: UpdateMemoVariables) =>
      memoApi.updateMemo(Number(nodeId), { content }),

    onSuccess: (_data, { treeId, nodeId, content }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, memo: content } }
              : node,
          ),
      );
    },
  });
};
