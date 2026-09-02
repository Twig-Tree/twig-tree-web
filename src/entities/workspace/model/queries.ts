import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../api/workspaceApi";
import { workspaceQueryKeys } from "./queryKeys";

/*
함수 이름 : useGetWorkspaceListQuery
기능 : 폴더 안의 워크스페이스 목록을 조회한다. 정렬은 서버가 수정 시각 내림차순으로 해 준다.
인자 : string | null folderId -> 조회할 폴더 ID. 루트는 null
반환값 : 워크스페이스 목록 query
*/
export function useGetWorkspaceListQuery(folderId: string | null) {
  const apiFolderId = folderId === null ? null : Number(folderId);
  const isValidFolderId =
    apiFolderId === null ||
    (Number.isSafeInteger(apiFolderId) && apiFolderId > 0);

  return useQuery({
    queryKey: workspaceQueryKeys.listByFolder(folderId),
    queryFn: () => workspaceApi.getWorkspaceList(apiFolderId),
    enabled: isValidFolderId,
  });
}
