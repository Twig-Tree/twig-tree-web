"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type WorkspaceItem,
  useCreateWorkspaceMutation,
  workspaceQueryKeys,
} from "@/src/entities/workspace";
import { getAvailableName } from "@/src/shared/lib/naming/getAvailableName";

// 이름을 묻지 않고 만들 때 붙이는 이름. 겹치면 뒤에 번호가 붙는다.
const DEFAULT_WORKSPACE_NAME = "Workspace";

// 생성을 진행할 수 없을 때 알리는 문구. 위치를 모르거나 유효하지 않을 때, 형제 목록을 모를 때, API 요청이 실패했을 때 모두 같은 결과(아무것도 만들어지지 않음)이므로 문구를 하나로 둔다.
const CREATE_WORKSPACE_FAILURE_MESSAGE =
  "워크스페이스 생성에 실패했습니다. 다시 시도해 주세요.";

interface UseCreateWorkspaceParams {
  folderId?: string | null; // 렌더 시점에 위치를 아는 화면만 넘긴다. 생략하면 createWorkspace 호출 인자로 위치를 받는다. 루트는 null
  workspaces?: WorkspaceItem[]; // 위 folderId 폴더의 형제 워크스페이스 목록. 기본 이름 계산에 쓴다
}

const isValidFolderId = (folderId: string | null): boolean =>
  folderId === null ||
  (Number.isSafeInteger(Number(folderId)) && Number(folderId) > 0);

/*
함수 이름 : useCreateWorkspace
기능 : 빈 워크스페이스를 생성한다. 위치를 렌더 시점에 아는 화면(디렉토리)은 파라미터로 받아 비활성 상태 판단에 쓰고, 확정 시점에야 아는 화면(최신순 팝업)은 createWorkspace 호출 인자로 받는다. 기본 이름은 형제 워크스페이스 목록에서 계산하며, 백엔드가 같은 위치의 이름 중복을 거절하므로 목록을 모르면 만들지 않는다.
인자 : UseCreateWorkspaceParams
반환값 : 워크스페이스 생성 핸들러와 생성 비활성화 상태
*/
export function useCreateWorkspace({
  folderId: paramsFolderId,
  workspaces: paramsWorkspaces,
}: UseCreateWorkspaceParams = {}) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateWorkspaceMutation();

  const isParamsFolderIdProvided = paramsFolderId !== undefined;

  /*
  파라미터로 folderId를 받지 않은 화면(최신순)은 이 시점에 위치를 모르므로 비활성 조건에
  넣을 것이 없다. 요청 중 여부만 남는다. folderId를 받은 화면(디렉토리)은 그 값과 형제
  목록 도착 여부까지 함께 판단한다.
  */
  const isCreateWorkspaceDisabled =
    isPending ||
    (isParamsFolderIdProvided &&
      (!isValidFolderId(paramsFolderId) || paramsWorkspaces === undefined));

  const createWorkspace = useCallback(
    async (folderId?: string | null): Promise<WorkspaceItem> => {
      const targetFolderId = folderId !== undefined ? folderId : paramsFolderId;

      if (targetFolderId === undefined || !isValidFolderId(targetFolderId)) {
        alert(CREATE_WORKSPACE_FAILURE_MESSAGE);
        throw new Error(
          "Workspace creation target folder id is missing or invalid.",
        );
      }

      /*
      렌더 시점에 받은 목록이 있으면 그것을 쓴다. 없으면(주로 호출 인자로 위치를 받는 화면)
      캐시에서 읽는다. 폴더 경로 선택 팝업이 확정 직전에 그 폴더의 목록을 이미 조회해 두므로
      이 시점에는 캐시에 있다.
      */
      const siblingWorkspaces =
        paramsWorkspaces ??
        queryClient.getQueryData<WorkspaceItem[]>(
          workspaceQueryKeys.listByFolder(targetFolderId),
        );

      if (siblingWorkspaces === undefined) {
        alert(CREATE_WORKSPACE_FAILURE_MESSAGE);
        throw new Error(
          "Sibling workspace list is unknown; refusing to guess a default name.",
        );
      }

      try {
        return await mutateAsync({
          name: getAvailableName(
            DEFAULT_WORKSPACE_NAME,
            siblingWorkspaces.map(({ name }) => name),
          ),
          folderId: targetFolderId,
        });
      } catch (error) {
        alert(CREATE_WORKSPACE_FAILURE_MESSAGE);
        console.error("Failed to create workspace", error);
        throw error;
      }
    },
    [mutateAsync, paramsFolderId, paramsWorkspaces, queryClient],
  );

  return {
    createWorkspace,
    isCreateWorkspaceDisabled,
  };
}
