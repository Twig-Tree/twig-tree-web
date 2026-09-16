import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { workspaceApi } from "../../api/workspaceApi";
import { TREE_ERROR_CODE } from "../constants";
import { workspaceQueryKeys } from "../queryKeys";

/*
함수 이름 : useCreateWorkspaceTreeMutation
기능 : 워크스페이스에 노드 없는 빈 트리를 생성한다. 이미 트리가 있다는 응답을 받으면 워크스페이스 상세 캐시를 무효화한다.
인자 : 없음
반환값 : 트리 생성 mutation. 성공 데이터는 생성된 트리 ID

컨벤션 예외 : 이 프로젝트는 캐시 갱신을 mutation 선언부 onSuccess에 두지만, 여기서는 워크스페이스 상세 캐시의 treeId를 채우지 않는다.
선언부 onSuccess는 응답 직후 실행되어, 캐시가 바뀌면 페이지가 새 treeId로 트리를 조회하기 시작한다.
그 조회가 뒤이어 보내는 루트 노드 생성과 겹치면 useInitializeTree와 호출부가 같은 루트를 store에 두 번 넣을 수 있다.
따라서 호출부가 루트 노드를 store에 반영한 뒤 useSetWorkspaceTreeIdInCache로 직접 채운다.
*/
export function useCreateWorkspaceTreeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspaceApi.createWorkspaceTree(Number(workspaceId)),

    /*
    다른 곳에서 먼저 트리를 만든 경우다. 응답에 기존 treeId가 없어 캐시를 직접 채울 수 없으므로 다시 조회한다.
    이때는 루트 노드를 만들지 못해 store가 비어 있으므로, 조회 결과로 편집기가 채워져도 겹칠 노드가 없다.
    */
    onError: (error, workspaceId) => {
      if (getApiErrorCode(error) !== TREE_ERROR_CODE.TREE_ALREADY_EXISTS) {
        return;
      }

      return queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.detail(workspaceId),
      });
    },
  });
}
