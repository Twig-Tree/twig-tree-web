"use client";

import { useCallback } from "react";
import { isValidFolderId } from "@/src/entities/folder";
import {
  type WorkspaceItem,
  useUpdateWorkspaceMutation,
} from "@/src/entities/workspace";
import { validateWorkspaceName } from "../lib/validateWorkspaceName";

interface UseUpdateWorkspaceParams {
  folderId: string | null; // 수정할 워크스페이스들이 속한 폴더 ID. 수정 후 이 폴더의 목록 캐시를 갱신한다. 루트는 null
  workspaces: WorkspaceItem[] | undefined; // 위 폴더의 형제 워크스페이스 목록. 아직 조회 전이면 undefined
}

interface UpdateWorkspaceInput {
  workspaceId: string; // 이름을 수정할 워크스페이스 ID
  name: string; // 사용자가 입력한 이름. 앞뒤 공백은 요청 전에 자른다
}

/*
함수 이름 : useUpdateWorkspace
기능 : 워크스페이스 이름 입력값을 검증하고, 통과하면 앞뒤 공백을 자른 이름으로 수정 요청을 보낸다.
백엔드가 같은 위치의 이름 중복을 거절하므로 형제 목록을 모르면 검증을 통과시키지 않는다.
인자 : UseUpdateWorkspaceParams
반환값 : 이름 검증 함수, 이름 수정 핸들러, 수정 요청 중 여부
*/
export function useUpdateWorkspace({
  folderId,
  workspaces,
}: UseUpdateWorkspaceParams) {
  const { mutateAsync, isPending } = useUpdateWorkspaceMutation();

  const isUpdateWorkspaceDisabled =
    isPending || !isValidFolderId(folderId) || workspaces === undefined;

  const getWorkspaceNameError = useCallback(
    ({ workspaceId, name }: UpdateWorkspaceInput) => {
      if (!workspaces) {
        return "워크스페이스 목록을 불러온 후 다시 시도해 주세요.";
      }

      return validateWorkspaceName({
        workspaceId,
        workspaces,
        name,
      });
    },
    [workspaces],
  );

  /*
  수정에 성공하면 true를 돌려준다. 호출부는 결과에 따라 편집 상태를 끝낼지 유지할지 정한다.
  */
  const updateWorkspace = useCallback(
    async ({ workspaceId, name }: UpdateWorkspaceInput): Promise<boolean> => {
      const validationError = getWorkspaceNameError({ workspaceId, name });

      if (isUpdateWorkspaceDisabled || validationError) {
        return false;
      }

      try {
        await mutateAsync({
          workspaceId,
          folderId,
          name: name.trim(),
        });
        return true;
      } catch (error) {
        alert("워크스페이스 이름을 수정하지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to update workspace", error);
        return false;
      }
    },
    [folderId, getWorkspaceNameError, isUpdateWorkspaceDisabled, mutateAsync],
  );

  return {
    getWorkspaceNameError,
    isUpdateWorkspaceDisabled,
    isUpdatingWorkspace: isPending,
    updateWorkspace,
  };
}
