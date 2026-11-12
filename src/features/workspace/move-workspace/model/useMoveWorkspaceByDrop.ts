"use client";

import { useCallback } from "react";
import type { WorkspaceItem } from "@/src/entities/workspace";
import { showToast } from "@/src/shared/ui/toast";
import { useRequestMoveWorkspace } from "./useRequestMoveWorkspace";

/*
함수 이름 : useMoveWorkspaceByDrop
기능 : 끌어 놓은 워크스페이스를 놓은 폴더로 옮기고, 실패하면 토스트로 알린다.
인자 : 없음
반환값 : 드롭 이동 함수

위치 선택 팝업과 달리 놓는 순간 대상과 위치를 함께 받는다. 실패를 띄울 팝업이 없어 토스트로 알린다.
드롭은 대상마다 따로 일어나므로 다른 워크스페이스의 이동이 진행 중이어도 막지 않는다.
*/
export function useMoveWorkspaceByDrop() {
  const { requestMoveWorkspace } = useRequestMoveWorkspace();

  /*
  함수 이름 : moveWorkspaceByDrop
  기능 : 워크스페이스를 놓은 폴더로 옮긴다.
  인자 : WorkspaceItem workspace -> 끌어 온 워크스페이스
  string | null toFolderId -> 놓은 위치의 폴더 ID. 루트는 null
  반환값 : 없음
  */
  const moveWorkspaceByDrop = useCallback(
    async (workspace: WorkspaceItem, toFolderId: string | null) => {
      const result = await requestMoveWorkspace(workspace, toFolderId);

      if (result.status === "failed") {
        showToast({ message: result.errorMessage, tone: "error" });
      }
    },
    [requestMoveWorkspace],
  );

  return { moveWorkspaceByDrop };
}
