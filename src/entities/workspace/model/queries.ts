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

ID 형식은 검사하지 않는다. URL에서 온 ID는 라우트 파라미터를 읽는 페이지가 먼저 걸러 잘못된 링크를 안내한다.
enabled로 막지 않는 것은 그 옵션이 "아직 조회할 때가 아님"을 위한 것이기 때문이다. 검증에 쓰면 query가
로딩도 오류도 아닌 상태로 멈춰, 검사를 빠뜨린 호출부의 실수가 드러나지 않는다.
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

/*
함수 이름 : useGetRecentWorkspaceListQuery
기능 : 폴더와 무관하게 내 워크스페이스를 수정 시각 내림차순으로 조회한다.
인자 : 없음
반환값 : 최신순 워크스페이스 목록 query

응답이 페이지 단위로 바뀌어 지금은 첫 페이지만 받는다. 화면별 첫 페이지 query와 infinite query로 나누면서 지운다(#91).
*/
export function useGetRecentWorkspaceListQuery() {
  return useQuery({
    queryKey: workspaceQueryKeys.recent(),
    queryFn: () =>
      workspaceApi.getRecentWorkspaceList({ cursor: null, size: 20 }),
    select: (page) => page.workspaces,
  });
}
