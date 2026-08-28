import { useQuery } from "@tanstack/react-query";
import { folderApi } from "../api/folderApi";
import { folderQueryKeys } from "./queryKeys";

export function useGetFolderQuery(folderId: string) {
  const apiFolderId = Number(folderId);
  const isValidFolderId = Number.isSafeInteger(apiFolderId) && apiFolderId > 0;

  return useQuery({
    queryKey: folderQueryKeys.detail(folderId),
    queryFn: () => folderApi.getFolder(apiFolderId),
    enabled: isValidFolderId,
  });
}

/*
함수 이름 : useGetFolderPathQuery
기능 : 해당 폴더 자신을 포함한 상위 경로를 루트부터 순서대로 조회한다.
인자 : string folderId -> 경로의 끝이 될 폴더 ID
반환값 : 루트부터 해당 폴더까지의 폴더 목록 query
*/
export function useGetFolderPathQuery(folderId: string) {
  const apiFolderId = Number(folderId);
  const isValidFolderId = Number.isSafeInteger(apiFolderId) && apiFolderId > 0;

  return useQuery({
    queryKey: folderQueryKeys.path(folderId),
    queryFn: () => folderApi.getFolderPath(apiFolderId),
    enabled: isValidFolderId,
  });
}

export function useGetFolderListQuery(folderParentId: string | null) {
  const apiFolderParentId =
    folderParentId === null ? null : Number(folderParentId);
  const isValidFolderParentId =
    apiFolderParentId === null ||
    (Number.isSafeInteger(apiFolderParentId) && apiFolderParentId > 0);

  return useQuery({
    queryKey: folderQueryKeys.childrenByParent(folderParentId),
    queryFn: () => folderApi.getFolderList(apiFolderParentId),
    enabled: isValidFolderParentId,
  });
}
