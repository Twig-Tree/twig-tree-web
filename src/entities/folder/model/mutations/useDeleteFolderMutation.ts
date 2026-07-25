import { useMutation, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "../../api/folderApi";
import { folderQueryKeys } from "../queryKeys";

interface DeleteFolderVariables {
  folderId: string;
  folderParentId: string | null;
}

export function useDeleteFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId }: DeleteFolderVariables) => {
      return folderApi.deleteFolder(Number(folderId));
    },
    onSuccess: (_data, variables) => {
      return queryClient.invalidateQueries({
        queryKey: folderQueryKeys.childrenByParent(variables.folderParentId),
      });
    },
  });
}
