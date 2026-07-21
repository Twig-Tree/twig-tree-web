import { useMutation, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "../../api/folderApi";
import type { CreateFolderRequest } from "../../api/types";
import { folderQueryKeys } from "../queryKeys";

interface CreateFolderVariables {
  name: string;
  folderParentId: string | null;
}

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, folderParentId }: CreateFolderVariables) => {
      const request: CreateFolderRequest = {
        name,
        folderParentId: folderParentId === null ? null : Number(folderParentId),
      };

      return folderApi.createFolder(request);
    },
    onSuccess: (_createdFolder, variables) => {
      return queryClient.invalidateQueries({
        queryKey: folderQueryKeys.childrenByParent(variables.folderParentId),
      });
    },
  });
}
