import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagApi } from "@/src/entities/tree/api/tagApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface RemoveNodeTagVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 태그를 뗄 노드 ID
  tagId: string; // 뗄 트리 태그 ID
}

/*
함수 이름 : useRemoveNodeTagMutation
기능 : 노드 태그 제거 API 요청을 수행하고, 성공 시 트리 조회 캐시의 해당 노드 tagIds에서 태그를 뺀다. 트리 태그는 남는다.
인자 : 없음
반환값 : 노드 태그 제거 mutation 객체
*/
export const useRemoveNodeTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, tagId }: RemoveNodeTagVariables) =>
      tagApi.removeNodeTag(Number(nodeId), Number(tagId)),

    onSuccess: (_data, { treeId, nodeId, tagId }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.id === nodeId
              ? { ...node, tagIds: node.tagIds.filter((id) => id !== tagId) }
              : node,
          ),
      );
    },
  });
};
