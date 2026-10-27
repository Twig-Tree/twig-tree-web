import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagApi } from "@/src/entities/tree/api/tagApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface AddNodeTagVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 태그를 붙일 노드 ID
  tagId: string; // 붙일 트리 태그 ID
}

/*
함수 이름 : useAddNodeTagMutation
기능 : 노드 태그 추가 API 요청을 수행하고, 성공 시 트리 조회 캐시의 해당 노드 tagIds 끝에 태그를 덧붙인다.
노드 태그는 별도 캐시를 두지 않고 트리 조회 캐시에 얹혀 있는 값을 갱신한다.
인자 : 없음
반환값 : 노드 태그 추가 mutation 객체
*/
export const useAddNodeTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, tagId }: AddNodeTagVariables) =>
      tagApi.addNodeTag(Number(nodeId), Number(tagId)),

    onSuccess: (addedTag, { treeId, nodeId }) => {
      queryClient.setQueryData<TreeNode[]>(
        treeQueryKeys.detail(treeId),
        (oldNodes) =>
          oldNodes?.map((node) =>
            node.id === nodeId && !node.tagIds.includes(addedTag.id)
              ? { ...node, tagIds: [...node.tagIds, addedTag.id] }
              : node,
          ),
      );
    },
  });
};
