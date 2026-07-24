import { useMutation, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "../../api/folderApi";
import type { UpdateFolderRequest } from "../../api/types";
import { folderQueryKeys } from "../queryKeys";

interface UpdateFolderVariables {
  folderId: string;
  folderParentId: string | null;
  name: string;
}

export function useUpdateFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, name }: UpdateFolderVariables) => {
      const request: UpdateFolderRequest = {
        name,
      };

      return folderApi.updateFolder(Number(folderId), request);
    },
    onSuccess: (_updatedFolder, variables) => {
      return queryClient.invalidateQueries({
        queryKey: folderQueryKeys.childrenByParent(variables.folderParentId),
      });
    },
  });
}
