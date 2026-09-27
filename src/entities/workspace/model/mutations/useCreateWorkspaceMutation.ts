import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiFolderId } from "@/src/entities/folder";
import { workspaceApi } from "../../api/workspaceApi";
import type { CreateWorkspaceRequest } from "../../api/types";
import { workspaceQueryKeys } from "../queryKeys";

interface CreateWorkspaceVariables {
  name: string;
  folderId: string | null;
}

/*
함수 이름 : useCreateWorkspaceMutation
기능 : 워크스페이스를 생성하고, 생성한 위치의 목록과 최신순 목록 캐시를 무효화한다.
인자 : 없음
반환값 : 워크스페이스 생성 mutation
*/
export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, folderId }: CreateWorkspaceVariables) => {
      const request: CreateWorkspaceRequest = {
        name,
        folderId: getApiFolderId(folderId),
      };

      return workspaceApi.createWorkspace(request);
    },
    /*
    최신순 목록은 폴더를 가리지 않으므로 어디에 만들든 맨 위에 새 항목이 생긴다.
    */
    onSuccess: (_createdWorkspace, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.listByFolder(variables.folderId),
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.recent(),
        }),
      ]);
    },
  });
}
