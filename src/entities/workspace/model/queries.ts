import { useQuery } from "@tanstack/react-query";
import { getApiFolderId, isValidFolderId } from "@/src/entities/folder";
import { isClientError } from "@/src/shared/api/httpErrors";
import { workspaceApi } from "../api/workspaceApi";
import { workspaceQueryKeys } from "./queryKeys";

const MAX_WORKSPACE_RETRY_COUNT = 1; // 전역 QueryClient의 retry와 같은 값

/*
함수 이름 : useGetWorkspaceQuery
기능 : 워크스페이스 ID로 워크스페이스 하나를 조회한다.
인자 : string workspaceId -> 조회할 워크스페이스 ID
반환값 : 워크스페이스 조회 query

URL에서 온 ID를 검증하지 않고 그대로 요청한다. enabled로 막으면 query가 로딩도 오류도 아닌 상태로 남아
잘못된 링크를 안내할 수 없기 때문이다. 검증 경계는 #53에서 정한다.
*/
export function useGetWorkspaceQuery(workspaceId: string) {
  return useQuery({
    queryKey: workspaceQueryKeys.detail(workspaceId),
    queryFn: () => workspaceApi.getWorkspace(Number(workspaceId)),
    /*
    없는 워크스페이스(404)나 남의 워크스페이스(403)는 다시 요청해도 같으므로 바로 오류로 넘긴다.
    */
    retry: (failureCount, error) =>
      !isClientError(error) && failureCount < MAX_WORKSPACE_RETRY_COUNT,
  });
}

/*
함수 이름 : useGetWorkspaceListQuery
기능 : 폴더 안의 워크스페이스 목록을 조회한다. 정렬은 서버가 수정 시각 내림차순으로 해 준다.
인자 : string | null folderId -> 조회할 폴더 ID. 루트는 null
반환값 : 워크스페이스 목록 query
*/
export function useGetWorkspaceListQuery(folderId: string | null) {
  return useQuery({
    queryKey: workspaceQueryKeys.listByFolder(folderId),
    queryFn: () => workspaceApi.getWorkspaceList(getApiFolderId(folderId)),
    enabled: isValidFolderId(folderId),
  });
}
