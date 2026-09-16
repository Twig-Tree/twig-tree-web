import { useQueryClient } from "@tanstack/react-query";
import type { WorkspaceDetail } from "./types";
import { workspaceQueryKeys } from "./queryKeys";

/*
함수 이름 : useSetWorkspaceTreeIdInCache
기능 : 워크스페이스 상세 캐시의 treeId만 서버가 확정한 값으로 채우는 함수를 만든다.
인자 : 없음
반환값 : (workspaceId, treeId)를 받아 상세 캐시를 갱신하는 함수

컨벤션 예외 : 트리 생성 결과는 원래 useCreateWorkspaceTreeMutation 선언부 onSuccess에서 캐시에 반영해야 하지만,
반영 시점을 호출부가 정해야 해서 따로 뺐다. 이유는 useCreateWorkspaceTreeMutation의 주석을 참고한다.
캐시 키와 모양은 entity가 알고 있으므로 갱신 방법은 여기에 두고, feature는 호출 시점만 정한다.

상세 캐시가 없으면 만들지 않는다. 다른 필드를 모르는 채로 캐시를 만들면 조회하지 않은 값이 성공 데이터처럼 보인다.
*/
export function useSetWorkspaceTreeIdInCache() {
  const queryClient = useQueryClient();

  return (workspaceId: string, treeId: string) => {
    queryClient.setQueryData<WorkspaceDetail>(
      workspaceQueryKeys.detail(workspaceId),
      (workspace) => (workspace ? { ...workspace, treeId } : workspace),
    );
  };
}
