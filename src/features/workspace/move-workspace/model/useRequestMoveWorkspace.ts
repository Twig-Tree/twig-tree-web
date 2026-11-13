"use client";

import { useCallback } from "react";
import { isValidFolderId } from "@/src/entities/folder";
import {
  useMoveWorkspaceMutation,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { getMoveWorkspaceErrorMessage } from "../lib/getMoveWorkspaceErrorMessage";

/*
이동 요청 하나의 결과. 실패를 어떻게 보여줄지(팝업 안 문구, 토스트)는 부르는 쪽이 정한다.
skipped는 옮길 것이 없어 요청하지 않았다는 뜻이다. 실패가 아니므로 안내하지 않는다.
*/
export type MoveWorkspaceResult =
  | { status: "moved" }
  | { status: "skipped" }
  | { status: "failed"; errorMessage: string };

/*
함수 이름 : useRequestMoveWorkspace
기능 : 워크스페이스 하나를 고른 폴더로 옮기는 요청을 보낸다. 요청 전에 알 수 있는 경우는 거르고, 실패는 안내 문구로 바꿔 돌려준다.
인자 : 없음
반환값 : 이동 요청 함수와 요청 상태

위치 선택 팝업과 드래그앤드롭이 함께 쓴다. 지금 위치는 워크스페이스가 가진 folderId로 판단한다.
*/
export function useRequestMoveWorkspace() {
  const { mutateAsync, isPending } = useMoveWorkspaceMutation();

  /*
  함수 이름 : requestMoveWorkspace
  기능 : 워크스페이스를 toFolderId 폴더로 옮긴다.
  인자 : WorkspaceItem workspace -> 옮길 워크스페이스
  string | null toFolderId -> 옮겨 갈 폴더 ID. 루트는 null
  반환값 : 이동 결과
  */
  const requestMoveWorkspace = useCallback(
    async (
      workspace: WorkspaceItem,
      toFolderId: string | null,
    ): Promise<MoveWorkspaceResult> => {
      if (toFolderId === workspace.folderId) return { status: "skipped" };

      if (!isValidFolderId(toFolderId)) {
        return {
          status: "failed",
          errorMessage: getMoveWorkspaceErrorMessage(null),
        };
      }

      try {
        await mutateAsync({
          workspaceId: workspace.id,
          fromFolderId: workspace.folderId,
          toFolderId,
        });
      } catch (error) {
        console.error("Failed to move workspace", error);
        return {
          status: "failed",
          errorMessage: getMoveWorkspaceErrorMessage(getApiErrorCode(error)),
        };
      }

      return { status: "moved" };
    },
    [mutateAsync],
  );

  return { requestMoveWorkspace, isRequestingMoveWorkspace: isPending };
}
