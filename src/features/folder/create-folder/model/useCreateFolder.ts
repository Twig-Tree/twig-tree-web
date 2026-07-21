"use client";

import { useCallback, useState } from "react";
import {
  type FolderItem,
  useCreateFolderMutation,
} from "@/src/entities/folder";
import { getAvailableFolderName } from "../lib/getAvailableFolderName";

interface UseCreateFolderParams {
  initialFolders: FolderItem[];
  folderParentId: number | null;
}

export function useCreateFolder({
  initialFolders,
  folderParentId,
}: UseCreateFolderParams) {
  const [folders, setFolders] = useState(initialFolders);
  const { mutateAsync, isPending } = useCreateFolderMutation();

  const isValidFolderParentId =
    folderParentId === null ||
    (Number.isSafeInteger(folderParentId) && folderParentId > 0);

  const isCreateFolderDisabled = isPending || !isValidFolderParentId;

  const createFolder = useCallback(async () => {
    if (isCreateFolderDisabled) return;

    try {
      const folder = await mutateAsync({
        name: getAvailableFolderName(folders),
        folderParentId,
      });

      setFolders((currentFolders) => [...currentFolders, folder]);
    } catch (error) {
      alert("폴더 생성에 실패했습니다. 다시 시도해 주세요.");
      console.error("Failed to create folder", error);
    }
  }, [folders, folderParentId, isCreateFolderDisabled, mutateAsync]);

  return {
    folders,
    createFolder,
    isCreateFolderDisabled,
  };
}
