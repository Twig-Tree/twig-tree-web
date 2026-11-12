import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useSetWorkspaceTreeIdInCache,
  workspaceQueryKeys,
} from "@/src/entities/workspace";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { treeApi } from "../../api/treeApi";
import type { TreeMockScenario } from "../../api/types";
import { TREE_REQUEST_ERROR_CODE } from "../constants";
import { treeQueryKeys } from "../queryKeys";

interface CreateWorkspaceTreeFromPromptVariables {
  workspaceId: string; // 채울 워크스페이스 ID
  message: string; // 사용자가 입력한 지시문. 첨부만 보내는 경우 빈 문자열일 수 있다
  file?: File; // 첨부 파일. 있으면 multipart로 보낸다
  mock?: TreeMockScenario; // 개발용. 주면 백엔드가 LLM을 호출하지 않고 고정 트리를 돌려준다
}

/*
함수 이름 : useCreateWorkspaceTreeFromPromptMutation
기능 : 프롬프트로 이미 있는 빈 워크스페이스를 트리로 채우고, 워크스페이스 상세의 treeId와 낡은 트리·최신순 목록 캐시를 갱신한다.
이미 노드가 있다고 거절되면 그 트리를 보이도록 워크스페이스 상세와 트리 조회를 무효화한다.
인자 : 없음
반환값 : 워크스페이스 트리 채우기 mutation. 성공 데이터는 워크스페이스 ID, 트리 ID

응답의 노드는 트리 캐시에 넣지 않고 트리 조회를 무효화한다. useCreateTreeFromPromptMutation과 같은 이유로,
응답 노드에는 version과 tagIds가 없어 넣으면 그 노드의 이름·메모 저장이 version 없이 나간다.

트리 요청 mutation key를 단다. 다른 곳의 변경을 찾는 쪽(useTreeRequestTracker)이 이 탭의 요청이 진행 중인 동안
비교를 미뤄야, 응답을 기다리는 사이의 재조회 결과를 다른 곳의 변경으로 오판하지 않는다.

트리는 워크스페이스의 자식이라 entities/workspace를 import한다(fsd-layers.md "Entity 사이의 의존 방향").
*/
export const useCreateWorkspaceTreeFromPromptMutation = () => {
  const queryClient = useQueryClient();
  const setWorkspaceTreeIdInCache = useSetWorkspaceTreeIdInCache();

  return useMutation({
    mutationKey: treeQueryKeys.mutations(),

    mutationFn: ({
      workspaceId,
      ...params
    }: CreateWorkspaceTreeFromPromptVariables) =>
      treeApi.createWorkspaceTreeFromPrompt(Number(workspaceId), params),

    onSuccess: ({ workspaceId, treeId }) => {
      /*
      트리가 없던 워크스페이스는 상세 캐시의 treeId가 채워지면서 편집기가 새 트리를 조회한다.
      노드 없는 트리가 있던 워크스페이스는 treeId가 같으므로 트리 조회를 무효화해 노드를 다시 받는다.
      서버가 워크스페이스 updatedAt을 갱신하므로 최신순 목록도 낡는다. 이름은 바뀌지 않는다.
      */
      setWorkspaceTreeIdInCache(workspaceId, treeId);

      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: treeQueryKeys.detail(treeId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.recent(),
        }),
      ]);
    },

    onError: (error, { workspaceId }) => {
      if (
        getApiErrorCode(error) !==
        TREE_REQUEST_ERROR_CODE.WORKSPACE_TREE_NOT_EMPTY
      ) {
        return;
      }

      /*
      다른 곳에서 먼저 트리를 채운 경우다. 응답을 기다리는 사이에 생겼을 수도 있다.
      트리가 새로 생겼으면 상세의 treeId가, 빈 트리에 노드가 생겼으면 트리 조회가 낡았다.
      거절 응답에는 treeId가 없어 트리 조회는 열려 있는 것을 모두 무효화한다. 다시 받는 것은 화면에 걸린 트리뿐이다.
      */
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.detail(workspaceId),
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: treeQueryKeys.details() }),
      ]);
    },
  });
};
