import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiFolderId } from "@/src/entities/folder";
import { workspaceApi } from "../../api/workspaceApi";
import type { MoveWorkspaceRequest } from "../../api/types";
import { workspaceQueryKeys } from "../queryKeys";

interface MoveWorkspaceVariables {
  workspaceId: string; // 옮길 워크스페이스 ID
  fromFolderId: string | null; // 지금 속한 폴더 ID. 요청에는 싣지 않고 목록 캐시를 찾는 데만 쓴다. 루트는 null
  toFolderId: string | null; // 옮겨 갈 폴더 ID. 루트는 null
}

/*
함수 이름 : useMoveWorkspaceMutation
기능 : 워크스페이스를 다른 폴더로 옮기고, 상세 캐시는 응답으로 확정하고 예전·새 폴더의 목록과 최신순 목록 캐시는 무효화한다.
인자 : 없음
반환값 : 워크스페이스 이동 mutation
*/
export function useMoveWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, toFolderId }: MoveWorkspaceVariables) => {
      const request: MoveWorkspaceRequest = {
        folderId: getApiFolderId(toFolderId),
      };

      return workspaceApi.moveWorkspace(Number(workspaceId), request);
    },
    onSuccess: (movedWorkspace, variables) => {
      /*
      응답이 treeId까지 모든 필드를 담고 있어 상세 캐시를 그대로 덮어도 조회 결과와 같다.
      워크스페이스 화면의 경로 표시가 재조회를 기다리지 않고 새 폴더를 가리킨다.
      */
      queryClient.setQueryData(
        workspaceQueryKeys.detail(variables.workspaceId),
        movedWorkspace,
      );

      /*
      서버가 이동에도 수정 시각을 갱신해, 최신순 목록에서 이 워크스페이스가 맨 앞으로 온다.
      */
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.listByFolder(variables.fromFolderId),
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.listByFolder(variables.toFolderId),
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.recent(),
        }),
      ]);
    },
  });
}
