import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../../api/workspaceApi";
import type { UpdateWorkspaceRequest } from "../../api/types";
import { workspaceQueryKeys } from "../queryKeys";

interface UpdateWorkspaceVariables {
  workspaceId: string;
  folderId: string | null; // 워크스페이스가 속한 폴더 ID. 요청에는 싣지 않고 목록 캐시를 찾는 데만 쓴다. 루트는 null
  name: string;
}

/*
함수 이름 : useUpdateWorkspaceMutation
기능 : 워크스페이스 이름을 수정하고, 상세 캐시는 응답으로 확정하고 속한 폴더의 목록 캐시는 무효화한다.
인자 : 없음
반환값 : 워크스페이스 이름 수정 mutation

최신순 목록(#62)은 아직 이 프로젝트에 없어 무효화 대상에 넣지 않는다.
그 query가 생기면 위치와 무관하게 함께 무효화해야 한다.
*/
export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, name }: UpdateWorkspaceVariables) => {
      const request: UpdateWorkspaceRequest = {
        name,
      };

      return workspaceApi.updateWorkspace(Number(workspaceId), request);
    },
    onSuccess: (updatedWorkspace, variables) => {
      /*
      응답이 treeId까지 모든 필드를 담고 있어 상세 캐시를 그대로 덮어도 조회 결과와 같다.
      워크스페이스 화면으로 이동했을 때 재조회를 기다리지 않고 새 이름을 보여준다.
      */
      queryClient.setQueryData(
        workspaceQueryKeys.detail(variables.workspaceId),
        updatedWorkspace,
      );

      /*
      목록은 이름만 고쳐 넣지 않는다. 수정 시각이 바뀌어 수정 시각 내림차순인 목록의 순서도 달라진다.
      */
      return queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.listByFolder(variables.folderId),
      });
    },
  });
}
