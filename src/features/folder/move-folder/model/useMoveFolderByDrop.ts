"use client";

import { useCallback } from "react";
import type { FolderItem } from "@/src/entities/folder";
import { showToast } from "@/src/shared/ui/toast";
import { useRequestMoveFolder } from "./useRequestMoveFolder";

interface UseMoveFolderByDropParams {
  folderParentId: string | null; // 끌어 온 폴더들이 지금 들어 있는 폴더 ID. 루트는 null
}

/*
함수 이름 : useMoveFolderByDrop
기능 : 끌어 놓은 폴더를 놓은 위치로 옮기고, 실패하면 토스트로 알린다.
인자 : UseMoveFolderByDropParams
반환값 : 드롭 이동 함수

위치 선택 팝업과 달리 놓는 순간 대상과 위치를 함께 받는다. 실패를 띄울 팝업이 없어 토스트로 알린다.
드롭은 대상마다 따로 일어나므로 다른 폴더의 이동이 진행 중이어도 막지 않는다.
*/
export function useMoveFolderByDrop({
  folderParentId,
}: UseMoveFolderByDropParams) {
  const { requestMoveFolder } = useRequestMoveFolder({ folderParentId });

  /*
  함수 이름 : moveFolderByDrop
  기능 : 폴더를 놓은 위치 아래로 옮긴다.
  인자 : FolderItem folder -> 끌어 온 폴더
  string | null toParentId -> 놓은 위치의 폴더 ID. 루트는 null
  반환값 : 없음
  */
  const moveFolderByDrop = useCallback(
    async (folder: FolderItem, toParentId: string | null) => {
      const result = await requestMoveFolder(folder, toParentId);

      if (result.status === "failed") {
        showToast({ message: result.errorMessage, tone: "error" });
      }
    },
    [requestMoveFolder],
  );

  return { moveFolderByDrop };
}
