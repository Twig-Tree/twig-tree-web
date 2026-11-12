"use client";

import { useCallback, useState } from "react";
import type { FolderItem } from "@/src/entities/folder";
import { useRequestMoveFolder } from "./useRequestMoveFolder";

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
  const { requestMoveFolder, isRequestingMoveFolder } = useRequestMoveFolder({
    folderParentId,
  });
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
      if (!movingFolder || isRequestingMoveFolder) return false;

      const result = await requestMoveFolder(movingFolder, toParentId);

      if (result.status === "failed") {
        setErrorMessage(result.errorMessage);
        return false;
      }

      /*
      팝업이 닫힐 때를 기다리지 않고 여기서 비운다. 마지막 항목을 옮겨 목록이 비면 화면이 팝업째 빈 상태 안내로 바뀌어
      팝업의 닫기 callback이 불리지 않는다. 남겨 두면 목록이 다시 그려질 때 이미 옮긴 항목의 팝업이 다시 열린다.
      같은 위치라 요청하지 않은 경우도 옮길 것이 없으므로 똑같이 닫는다.
      */
      setMovingFolder(null);
      setErrorMessage(null);
      return true;
    },
    [isRequestingMoveFolder, movingFolder, requestMoveFolder],
  );

  return {
    movingFolder,
    openMoveFolder,
    closeMoveFolder,
    moveFolder,
    isMovingFolder: isRequestingMoveFolder,
    moveFolderErrorMessage: errorMessage,
  };
}
