"use client";

import { useCallback } from "react";
import {
  FOLDER_ERROR_CODE,
  isValidFolderId,
  useMoveFolderMutation,
  type FolderItem,
} from "@/src/entities/folder";
import { getApiErrorCode } from "@/src/shared/api/authErrorCodes";
import { getMoveFolderErrorMessage } from "../lib/getMoveFolderErrorMessage";

/*
이동 요청 하나의 결과. 실패를 어떻게 보여줄지(팝업 안 문구, 토스트)는 부르는 쪽이 정한다.
skipped는 옮길 것이 없어 요청하지 않았다는 뜻이다. 실패가 아니므로 안내하지 않는다.
*/
export type MoveFolderResult =
  | { status: "moved" }
  | { status: "skipped" }
  | { status: "failed"; errorMessage: string };

interface UseRequestMoveFolderParams {
  folderParentId: string | null; // 옮길 폴더들이 지금 들어 있는 폴더 ID. 루트는 null
}

/*
함수 이름 : useRequestMoveFolder
기능 : 폴더 하나를 고른 위치로 옮기는 요청을 보낸다. 요청 전에 알 수 있는 경우는 거르고, 실패는 안내 문구로 바꿔 돌려준다.
인자 : UseRequestMoveFolderParams
반환값 : 이동 요청 함수와 요청 상태

위치 선택 팝업과 드래그앤드롭이 함께 쓴다. 두 흐름은 대상을 받는 시점과 실패를 보여주는 곳만 다르다.
*/
export function useRequestMoveFolder({
  folderParentId,
}: UseRequestMoveFolderParams) {
  const { mutateAsync, isPending } = useMoveFolderMutation();

  /*
  함수 이름 : requestMoveFolder
  기능 : 폴더를 toParentId 아래로 옮긴다.
  인자 : FolderItem folder -> 옮길 폴더
  string | null toParentId -> 옮겨 갈 부모 폴더 ID. 루트는 null
  반환값 : 이동 결과
  */
  const requestMoveFolder = useCallback(
    async (
      folder: FolderItem,
      toParentId: string | null,
    ): Promise<MoveFolderResult> => {
      if (toParentId === folderParentId) return { status: "skipped" };

      if (!isValidFolderId(folder.id) || !isValidFolderId(toParentId)) {
        return {
          status: "failed",
          errorMessage: getMoveFolderErrorMessage(null),
        };
      }

      // 화면이 자기 자신으로 옮기지 못하게 막지만, 서버에 묻기 전에 알 수 있는 경우는 여기서 거른다.
      if (toParentId === folder.id) {
        return {
          status: "failed",
          errorMessage: getMoveFolderErrorMessage(
            FOLDER_ERROR_CODE.INVALID_MOVE_TARGET,
          ),
        };
      }

      try {
        await mutateAsync({
          folderId: folder.id,
          fromParentId: folderParentId,
          toParentId,
        });
      } catch (error) {
        console.error("Failed to move folder", error);
        return {
          status: "failed",
          errorMessage: getMoveFolderErrorMessage(getApiErrorCode(error)),
        };
      }

      return { status: "moved" };
    },
    [folderParentId, mutateAsync],
  );

  return { requestMoveFolder, isRequestingMoveFolder: isPending };
}
