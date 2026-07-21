import { useMutation, useQueryClient } from "@tanstack/react-query";
import { folderApi } from "../../api/folderApi";
import { folderQueryKeys } from "../queryKeys";

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: folderQueryKeys.lists(),
    mutationFn: folderApi.createFolder,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: folderQueryKeys.lists(),
      }),
  });
}
