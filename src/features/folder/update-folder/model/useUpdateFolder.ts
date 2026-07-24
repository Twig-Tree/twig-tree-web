"use client";

import { useCallback } from "react";
import {
  type FolderItem,
  useUpdateFolderMutation,
} from "@/src/entities/folder";
import { validateFolderName } from "../lib/validateFolderName";

interface UseUpdateFolderParams {
  folders: FolderItem[] | undefined;
  folderParentId: string | null;
}

interface UpdateFolderInput {
  folderId: string;
  name: string;
}

export function useUpdateFolder({
  folders,
  folderParentId,
}: UseUpdateFolderParams) {
  const { mutateAsync, isPending } = useUpdateFolderMutation();

  const apiFolderParentId =
    folderParentId === null ? null : Number(folderParentId);

  const isValidFolderParentId =
    apiFolderParentId === null ||
    (Number.isSafeInteger(apiFolderParentId) && apiFolderParentId > 0);

  const isUpdateFolderDisabled =
    isPending || !isValidFolderParentId || folders === undefined;

  const getFolderNameError = useCallback(
    ({ folderId, name }: UpdateFolderInput) => {
      if (!folders) {
        return "폴더 목록을 불러온 후 다시 시도해 주세요.";
      }

      return validateFolderName({
        folderId,
        folders,
        name,
      });
    },
    [folders],
  );

  const updateFolder = useCallback(
    async ({ folderId, name }: UpdateFolderInput): Promise<boolean> => {
      const apiFolderId = Number(folderId);
      const isValidFolderId =
        Number.isSafeInteger(apiFolderId) && apiFolderId > 0;
      const validationError = getFolderNameError({ folderId, name });

      if (isUpdateFolderDisabled || !isValidFolderId || validationError) {
        return false;
      }

      try {
        await mutateAsync({
          folderId,
          folderParentId,
          name: name.trim(),
        });
        return true;
      } catch (error) {
        alert("폴더 이름을 수정하지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to update folder", error);
        return false;
      }
    },
    [folderParentId, getFolderNameError, isUpdateFolderDisabled, mutateAsync],
  );

  return {
    getFolderNameError,
    isUpdateFolderDisabled,
    isUpdatingFolder: isPending,
    updateFolder,
  };
}
