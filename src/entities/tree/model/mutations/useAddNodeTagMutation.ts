import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { tagApi } from "@/src/entities/tree/api/tagApi";
import { TAG_ERROR_CODE } from "@/src/entities/tree/model/constants";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

interface AddNodeTagVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 태그를 붙일 노드 ID
  tagId: string; // 붙일 트리 태그 ID
}

/*
함수 이름 : addTagIdToNodeInCache
기능 : 트리 조회 캐시에서 해당 노드의 tagIds 끝에 태그를 덧붙인다. 이미 있으면 그대로 둔다.
인자 : QueryClient queryClient -> 캐시를 가진 QueryClient
AddNodeTagVariables variables -> 트리 ID, 노드 ID, 태그 ID
반환값 : 없음
*/
const addTagIdToNodeInCache = (
  queryClient: QueryClient,
  { treeId, nodeId, tagId }: AddNodeTagVariables,
) => {
  queryClient.setQueryData<TreeNode[]>(
    treeQueryKeys.detail(treeId),
    (oldNodes) =>
      oldNodes?.map((node) =>
        node.id === nodeId && !node.tagIds.includes(tagId)
          ? { ...node, tagIds: [...node.tagIds, tagId] }
          : node,
      ),
  );
};

/*
함수 이름 : useAddNodeTagMutation
기능 : 노드 태그 추가 API 요청을 수행하고, 서버에 태그가 붙은 상태가 확정되면 트리 조회 캐시의 해당 노드 tagIds 끝에 태그를 덧붙인다.
노드 태그는 별도 캐시를 두지 않고 트리 조회 캐시에 얹혀 있는 값을 갱신한다.
인자 : 없음
반환값 : 노드 태그 추가 mutation 객체
*/
export const useAddNodeTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, tagId }: AddNodeTagVariables) =>
      tagApi.addNodeTag(Number(nodeId), Number(tagId)),

    onSuccess: (addedTag, variables) => {
      addTagIdToNodeInCache(queryClient, { ...variables, tagId: addedTag.id });
    },

    /*
    되돌리기가 아니다. TAG409-2는 다른 곳에서 먼저 붙여 서버에 이미 붙어 있다는 응답이라, 성공과 같은 상태를 캐시에 반영한다.
    반영하지 않으면 편집기를 다시 열 때 이 캐시로 store를 채워 태그가 사라진 것처럼 보인다.
    */
    onError: (error, variables) => {
      if (getApiErrorCode(error) !== TAG_ERROR_CODE.DUPLICATE_NODE_TAG) return;

      addTagIdToNodeInCache(queryClient, variables);
    },
  });
};
