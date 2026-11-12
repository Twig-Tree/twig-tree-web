"use client";

import { useCallback, useState } from "react";
import {
  FOLDER_ERROR_CODE,
  isValidFolderId,
  useMoveFolderMutation,
  type FolderItem,
} from "@/src/entities/folder";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { getMoveFolderErrorMessage } from "../lib/getMoveFolderErrorMessage";

interface UseMoveFolderParams {
  folderParentId: string | null; // 옮길 폴더들이 지금 들어 있는 폴더 ID. 루트는 null
}

/*
함수 이름 : useMoveFolder
기능 : 옮길 폴더를 고르고, 위치 선택 팝업에서 확정한 위치로 폴더 이동을 요청한다. 실패하면 팝업에 띄울 안내 문구를 남긴다.
인자 : UseMoveFolderParams
반환값 : 옮길 폴더, 이동 시작·취소·확정 handler, 요청 상태와 실패 안내 문구
*/
export function useMoveFolder({ folderParentId }: UseMoveFolderParams) {
  const { mutateAsync, isPending } = useMoveFolderMutation();
  const [movingFolder, setMovingFolder] = useState<FolderItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openMoveFolder = useCallback((folder: FolderItem) => {
    setMovingFolder(folder);
    setErrorMessage(null);
  }, []);

  const closeMoveFolder = useCallback(() => {
    setMovingFolder(null);
    setErrorMessage(null);
  }, []);

  /*
  위치 선택 팝업의 onSelect에 그대로 넘긴다. true를 돌려주면 팝업이 닫히고, false면 열린 채 errorMessage를 보여준다.
  */
  const moveFolder = useCallback(
    async (toParentId: string | null): Promise<boolean> => {
      if (!movingFolder || isPending) return false;

      /*
      같은 위치는 팝업이 이미 막는다. 그래도 들어오면 옮길 것이 없으므로 요청하지 않고 끝낸다.
      */
      if (toParentId === folderParentId) return true;

      if (!isValidFolderId(movingFolder.id) || !isValidFolderId(toParentId)) {
        setErrorMessage(getMoveFolderErrorMessage(null));
        return false;
      }

      // 팝업이 옮기는 폴더로 들어가지 못하게 막지만, 서버에 묻기 전에 알 수 있는 경우는 여기서 거른다.
      if (toParentId === movingFolder.id) {
        setErrorMessage(
          getMoveFolderErrorMessage(FOLDER_ERROR_CODE.INVALID_MOVE_TARGET),
        );
        return false;
      }

      try {
        await mutateAsync({
          folderId: movingFolder.id,
          fromParentId: folderParentId,
          toParentId,
        });
      } catch (error) {
        setErrorMessage(getMoveFolderErrorMessage(getApiErrorCode(error)));
        console.error("Failed to move folder", error);
        return false;
      }

      setErrorMessage(null);
      return true;
    },
    [folderParentId, isPending, movingFolder, mutateAsync],
  );

  return {
    movingFolder,
    openMoveFolder,
    closeMoveFolder,
    moveFolder,
    isMovingFolder: isPending,
    moveFolderErrorMessage: errorMessage,
  };
}
