import { useQuery } from "@tanstack/react-query";
import { folderApi } from "../api/folderApi";
import { folderQueryKeys } from "./queryKeys";

export function useGetFolderListQuery(folderParentId: string | null) {
  return useQuery({
    queryKey: folderQueryKeys.childrenByParent(folderParentId),
    queryFn: () =>
      folderApi.getFolderList(
        folderParentId === null ? null : Number(folderParentId),
      ),
  });
}
