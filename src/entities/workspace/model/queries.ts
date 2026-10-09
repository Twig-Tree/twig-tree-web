import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
함수 이름 : useGetRecentWorkspaceFirstPageQuery
기능 : 폴더와 무관하게 내 워크스페이스를 수정 시각 내림차순으로 첫 페이지만 조회한다.
인자 : number size -> 받을 개수
반환값 : 최신순 워크스페이스 목록 query

다음 페이지가 필요 없는 요약 화면용이다. 최신순 화면의 infinite query와 캐시가 갈리므로 두 화면을 오가면 조회가 한 번씩 나간다.
*/
export function useGetRecentWorkspaceFirstPageQuery(size: number) {
  return useQuery({
    queryKey: workspaceQueryKeys.recentFirstPage(size),
    queryFn: () => workspaceApi.getRecentWorkspaceList({ cursor: null, size }),
    select: (page) => page.workspaces,
  });
}

/*
함수 이름 : useGetRecentWorkspaceInfiniteQuery
기능 : 폴더와 무관하게 내 워크스페이스를 수정 시각 내림차순으로 커서를 이어 가며 한 페이지씩 조회한다.
인자 : number size -> 한 페이지에 받을 개수
반환값 : 불러온 페이지를 순서대로 펼친 워크스페이스 목록 infinite query

무효화되면 TanStack Query가 불러온 페이지 수만큼 첫 페이지부터 다시 조회하고, 다음 커서도 새로 받은 페이지에서 다시 구한다.
낡은 커서를 재사용하지 않으므로 그 사이 순서가 바뀌어도 목록이 맞는다.
커서 방식이라 수정되어 앞으로 간 항목이 뒤 페이지에 다시 나오지 않으므로 ID 중복은 제거하지 않는다.
*/
export function useGetRecentWorkspaceInfiniteQuery(size: number) {
  return useInfiniteQuery({
    queryKey: workspaceQueryKeys.recentInfinite(size),
    queryFn: ({ pageParam }) =>
      workspaceApi.getRecentWorkspaceList({ cursor: pageParam, size }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    select: (data) => data.pages.flatMap((page) => page.workspaces),
  });
}
