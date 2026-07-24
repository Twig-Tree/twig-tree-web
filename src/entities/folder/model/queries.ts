import { useQuery } from "@tanstack/react-query";
import { folderApi } from "../api/folderApi";
import { folderQueryKeys } from "./queryKeys";

export function useGetFolderQuery(folderId: string) {
  const apiFolderId = Number(folderId);
  const isValidFolderId =
    Number.isSafeInteger(apiFolderId) && apiFolderId > 0;

  return useQuery({
    queryKey: folderQueryKeys.detail(folderId),
    queryFn: () => folderApi.getFolder(apiFolderId),
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
