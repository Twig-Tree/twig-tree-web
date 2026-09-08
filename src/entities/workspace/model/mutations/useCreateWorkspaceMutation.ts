import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../../api/workspaceApi";
import type { CreateWorkspaceRequest } from "../../api/types";
import { workspaceQueryKeys } from "../queryKeys";

interface CreateWorkspaceVariables {
  name: string;
  folderId: string | null;
}

/*
함수 이름 : useCreateWorkspaceMutation
기능 : 워크스페이스를 생성하고, 생성한 위치의 워크스페이스 목록 캐시를 무효화한다.
인자 : 없음
반환값 : 워크스페이스 생성 mutation

최신순 목록(#62)은 아직 이 프로젝트에 없어 무효화 대상에 넣지 않는다.
그 query가 생기면 위치와 무관하게 함께 무효화해야 한다.
*/
export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, folderId }: CreateWorkspaceVariables) => {
      const request: CreateWorkspaceRequest = {
        name,
        folderId: folderId === null ? null : Number(folderId),
      };

      return workspaceApi.createWorkspace(request);
    },
    onSuccess: (_createdWorkspace, variables) => {
      return queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.listByFolder(variables.folderId),
      });
    },
  });
}
