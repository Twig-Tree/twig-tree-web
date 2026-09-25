import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../../api/workspaceApi";
import { workspaceQueryKeys } from "../queryKeys";

interface DeleteWorkspaceVariables {
  workspaceId: string;
  folderId: string | null; // 워크스페이스가 속한 폴더 ID. 요청에는 싣지 않고 목록 캐시를 찾는 데만 쓴다. 루트는 null
}

/*
함수 이름 : useDeleteWorkspaceMutation
기능 : 워크스페이스를 삭제하고, 상세 캐시는 제거하고 속한 폴더의 목록 캐시는 무효화한다.
인자 : 없음
반환값 : 워크스페이스 삭제 mutation

최신순 목록(#62)은 아직 이 프로젝트에 없어 무효화 대상에 넣지 않는다.
그 query가 생기면 위치와 무관하게 함께 무효화해야 한다.
*/
export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId }: DeleteWorkspaceVariables) =>
      workspaceApi.deleteWorkspace(Number(workspaceId)),
    onSuccess: (_data, variables) => {
      /*
      상세는 무효화하지 않고 지운다. 무효화만 하면 워크스페이스 화면으로 돌아왔을 때
      재조회가 끝나기 전까지 옛 상세의 treeId로 편집기가 그려져, 지워진 트리가 잠깐 보인다.
      상세가 없으면 지워진 트리의 캐시에 도달할 경로도 없으므로 트리 캐시는 gc에 맡긴다.
      */
      queryClient.removeQueries({
        queryKey: workspaceQueryKeys.detail(variables.workspaceId),
      });

      /*
      응답 본문이 없어 목록을 확정할 수 없으므로 무효화한다.
      */
      return queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.listByFolder(variables.folderId),
      });
    },
  });
}
