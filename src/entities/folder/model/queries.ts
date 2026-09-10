import { useQuery } from "@tanstack/react-query";
import { folderApi } from "../api/folderApi";
import { getApiFolderId, isValidFolderId } from "../lib/folderId";
import { folderQueryKeys } from "./queryKeys";

/*
함수 이름 : useGetFolderQuery
기능 : 폴더 ID로 폴더 하나를 조회한다.
인자 : string folderId -> 조회할 폴더 ID
반환값 : 폴더 조회 query
*/
export function useGetFolderQuery(folderId: string) {
  return useQuery({
    queryKey: folderQueryKeys.detail(folderId),
    queryFn: () => folderApi.getFolder(getApiFolderId(folderId)),
    enabled: isValidFolderId(folderId),
  });
}

/*
함수 이름 : useGetFolderPathQuery
기능 : 해당 폴더 자신을 포함한 상위 경로를 루트부터 순서대로 조회한다.
인자 : string folderId -> 경로의 끝이 될 폴더 ID
반환값 : 루트부터 해당 폴더까지의 폴더 목록 query
*/
export function useGetFolderPathQuery(folderId: string) {
  return useQuery({
    queryKey: folderQueryKeys.path(folderId),
    queryFn: () => folderApi.getFolderPath(getApiFolderId(folderId)),
    enabled: isValidFolderId(folderId),
  });
}

/*
함수 이름 : useGetFolderListQuery
기능 : 부모 폴더 기준으로 하위 폴더 목록을 조회한다. folderParentId가 null이면 루트의 폴더 목록을 조회한다.
인자 : string | null folderParentId -> 조회할 부모 폴더 ID. 루트는 null
반환값 : 폴더 목록 query
*/
export function useGetFolderListQuery(folderParentId: string | null) {
  return useQuery({
    queryKey: folderQueryKeys.childrenByParent(folderParentId),
    queryFn: () => folderApi.getFolderList(getApiFolderId(folderParentId)),
    enabled: isValidFolderId(folderParentId),
  });
}
