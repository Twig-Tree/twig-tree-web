import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagApi } from "@/src/entities/tree/api/tagApi";
import { TreeNode, TreeTag } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface DeleteTreeTagVariables {
  treeId: string; // 태그가 속한 트리 ID
  tagId: string; // 삭제할 트리 태그 ID
}

/*
함수 이름 : useDeleteTreeTagMutation
기능 : 트리 태그 삭제 API 요청을 수행하고, 성공 시 트리 태그 목록 캐시와 트리 조회 캐시의 노드 tagIds에서 그 태그를 뺀다.
인자 : 없음
반환값 : 트리 태그 삭제 mutation 객체
*/
export const useDeleteTreeTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treeId, tagId }: DeleteTreeTagVariables) =>
      tagApi.deleteTreeTag(Number(treeId), Number(tagId)),

    /*
    응답 본문은 없지만 지운 태그 ID를 알고 있어 두 캐시를 직접 확정할 수 있다.
    백엔드가 노드와의 연결도 함께 지우므로 트리 조회 캐시의 노드 tagIds에서도 뺀다.
    */
    onSuccess: (_data, { treeId, tagId }) => {
      queryClient.setQueryData<TreeTag[]>(
        treeQueryKeys.tags(treeId),
        (oldTags) => oldTags?.filter((tag) => tag.id !== tagId),
      );

      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.tagIds.includes(tagId)
              ? { ...node, tagIds: node.tagIds.filter((id) => id !== tagId) }
              : node,
          ),
      );
    },
  });
};
