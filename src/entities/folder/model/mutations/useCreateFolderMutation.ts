import { useMutation, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "../../api/folderApi";
import { folderQueryKeys } from "../queryKeys";

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.createFolder,
    onSuccess: (_createdFolder, variables) => {
      const parentId =
        variables.folderParentId === null
          ? null
          : String(variables.folderParentId);

      return queryClient.invalidateQueries({
        queryKey: folderQueryKeys.childrenByParent(parentId),
      });
    },
  });
}
