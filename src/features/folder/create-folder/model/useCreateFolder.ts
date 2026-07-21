"use client";

import { useCallback } from "react";
import {
  type FolderItem,
  useCreateFolderMutation,
} from "@/src/entities/folder";
import { getAvailableFolderName } from "../lib/getAvailableFolderName";

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

  const createFolder = useCallback(async () => {
    if (isCreateFolderDisabled || !folders) return;

    try {
      await mutateAsync({
        name: getAvailableFolderName(folders),
        folderParentId: apiFolderParentId,
      });
    } catch (error) {
      alert("폴더 생성에 실패했습니다. 다시 시도해 주세요.");
      console.error("Failed to create folder", error);
    }
  }, [apiFolderParentId, folders, isCreateFolderDisabled, mutateAsync]);

  return {
    createFolder,
    isCreateFolderDisabled,
  };
}
