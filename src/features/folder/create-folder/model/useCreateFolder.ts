"use client";

import { useCallback } from "react";
import {
  type FolderItem,
  useCreateFolderMutation,
} from "@/src/entities/folder";
import { getAvailableName } from "@/src/shared/lib/naming/getAvailableName";

// 이름을 묻지 않고 만들 때 붙이는 이름. 겹치면 뒤에 번호가 붙는다.
const DEFAULT_FOLDER_NAME = "Folder";

interface UseCreateFolderParams {
  folders: FolderItem[] | undefined;
  folderParentId: string | null;
}

export function useCreateFolder({
  folders,
  folderParentId,
}: UseCreateFolderParams) {
  const { mutateAsync, isPending } = useCreateFolderMutation();
  const apiFolderParentId =
    folderParentId === null ? null : Number(folderParentId);

  const isValidFolderParentId =
    apiFolderParentId === null ||
    (Number.isSafeInteger(apiFolderParentId) && apiFolderParentId > 0);

  const isCreateFolderDisabled =
    isPending || !isValidFolderParentId || folders === undefined;

  const createFolder = useCallback(async (): Promise<FolderItem> => {
    if (isCreateFolderDisabled || !folders) {
      throw new Error("Folder creation is currently disabled.");
    }

    try {
      return await mutateAsync({
        name: getAvailableName(
          DEFAULT_FOLDER_NAME,
          folders.map(({ name }) => name),
        ),
        folderParentId,
      });
    } catch (error) {
      alert("폴더 생성에 실패했습니다. 다시 시도해 주세요.");
      console.error("Failed to create folder", error);
      throw error;
    }
  }, [folderParentId, folders, isCreateFolderDisabled, mutateAsync]);

  return {
    createFolder,
    isCreateFolderDisabled,
  };
}
