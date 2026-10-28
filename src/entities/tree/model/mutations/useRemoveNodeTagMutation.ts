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

interface RemoveNodeTagVariables {
  treeId: string; // 노드가 속한 트리 ID, 트리 조회 캐시를 갱신할 때 사용한다
  nodeId: string; // 태그를 뗄 노드 ID
  tagId: string; // 뗄 트리 태그 ID
}

/*
함수 이름 : removeTagIdFromNodeInCache
기능 : 트리 조회 캐시에서 해당 노드의 tagIds에서만 태그를 뺀다.
인자 : QueryClient queryClient -> 캐시를 가진 QueryClient
RemoveNodeTagVariables variables -> 트리 ID, 노드 ID, 태그 ID
반환값 : 없음
*/
const removeTagIdFromNodeInCache = (
  queryClient: QueryClient,
  { treeId, nodeId, tagId }: RemoveNodeTagVariables,
) => {
  queryClient.setQueryData<TreeNode[]>(
    treeQueryKeys.detail(treeId),
    (oldNodes) =>
      oldNodes?.map((node) =>
        node.id === nodeId
          ? { ...node, tagIds: node.tagIds.filter((id) => id !== tagId) }
          : node,
      ),
  );
};

/*
함수 이름 : useRemoveNodeTagMutation
기능 : 노드 태그 제거 API 요청을 수행하고, 서버에서 연결이 없는 상태가 확정되면 트리 조회 캐시의 해당 노드 tagIds에서 태그를 뺀다. 트리 태그는 남는다.
인자 : 없음
반환값 : 노드 태그 제거 mutation 객체
*/
export const useRemoveNodeTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, tagId }: RemoveNodeTagVariables) =>
      tagApi.removeNodeTag(Number(nodeId), Number(tagId)),

    onSuccess: (_data, variables) => {
      removeTagIdFromNodeInCache(queryClient, variables);
    },

    /*
    되돌리기가 아니다. TAG404-2는 다른 곳에서 먼저 떼어 서버에 연결이 없다는 응답이라, 성공과 같은 상태를 캐시에 반영한다.
    반영하지 않으면 편집기를 다시 열 때 이 캐시로 store를 채워 뗀 태그가 되살아난다.
    */
    onError: (error, variables) => {
      if (getApiErrorCode(error) !== TAG_ERROR_CODE.NODE_TAG_NOT_FOUND) return;

      removeTagIdFromNodeInCache(queryClient, variables);
    },
  });
};
