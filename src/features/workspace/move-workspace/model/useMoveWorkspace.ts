"use client";

import { useCallback, useState } from "react";
import { isValidFolderId } from "@/src/entities/folder";
import {
  useMoveWorkspaceMutation,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { getMoveWorkspaceErrorMessage } from "../lib/getMoveWorkspaceErrorMessage";

/*
함수 이름 : useMoveWorkspace
기능 : 옮길 워크스페이스를 고르고, 위치 선택 팝업에서 확정한 폴더로 워크스페이스 이동을 요청한다. 실패하면 팝업에 띄울 안내 문구를 남긴다.
인자 : 없음
반환값 : 옮길 워크스페이스, 이동 시작·취소·확정 handler, 요청 상태와 실패 안내 문구

지금 위치는 워크스페이스가 가진 folderId를 쓴다. 최근 화면처럼 여러 폴더의 워크스페이스가 섞인 곳에서도 같은 hook을 쓸 수 있다.
*/
export function useMoveWorkspace() {
  const { mutateAsync, isPending } = useMoveWorkspaceMutation();
  const [movingWorkspace, setMovingWorkspace] = useState<WorkspaceItem | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openMoveWorkspace = useCallback((workspace: WorkspaceItem) => {
    setMovingWorkspace(workspace);
    setErrorMessage(null);
  }, []);

  const closeMoveWorkspace = useCallback(() => {
    setMovingWorkspace(null);
    setErrorMessage(null);
  }, []);

  /*
  위치 선택 팝업의 onSelect에 그대로 넘긴다. true를 돌려주면 팝업이 닫히고, false면 열린 채 errorMessage를 보여준다.
  */
  const moveWorkspace = useCallback(
    async (toFolderId: string | null): Promise<boolean> => {
      if (!movingWorkspace || isPending) return false;

      /*
      같은 위치는 팝업이 이미 막는다. 그래도 들어오면 옮길 것이 없으므로 요청하지 않고 끝낸다.
      */
      if (toFolderId === movingWorkspace.folderId) return true;

      if (!isValidFolderId(toFolderId)) {
        setErrorMessage(getMoveWorkspaceErrorMessage(null));
        return false;
      }

      try {
        await mutateAsync({
          workspaceId: movingWorkspace.id,
          fromFolderId: movingWorkspace.folderId,
          toFolderId,
        });
      } catch (error) {
        setErrorMessage(getMoveWorkspaceErrorMessage(getApiErrorCode(error)));
        console.error("Failed to move workspace", error);
        return false;
      }

      /*
      팝업이 닫힐 때를 기다리지 않고 여기서 비운다. 마지막 항목을 옮겨 목록이 비면 화면이 팝업째 빈 상태 안내로 바뀌어
      팝업의 닫기 callback이 불리지 않는다. 남겨 두면 목록이 다시 그려질 때 이미 옮긴 항목의 팝업이 다시 열린다.
      */
      setMovingWorkspace(null);
      setErrorMessage(null);
      return true;
    },
    [isPending, movingWorkspace, mutateAsync],
  );

  return {
    movingWorkspace,
    openMoveWorkspace,
    closeMoveWorkspace,
    moveWorkspace,
    isMovingWorkspace: isPending,
    moveWorkspaceErrorMessage: errorMessage,
  };
}
