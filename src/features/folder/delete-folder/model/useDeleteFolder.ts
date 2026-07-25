"use client";

import { useCallback } from "react";
import { useDeleteFolderMutation } from "@/src/entities/folder";

interface UseDeleteFolderParams {
  folderParentId: string | null;
}

interface DeleteFolderInput {
  folderId: string;
  name: string;
}

export function useDeleteFolder({ folderParentId }: UseDeleteFolderParams) {
  const { mutateAsync, isPending } = useDeleteFolderMutation();

  const deleteFolder = useCallback(
    async ({ folderId, name }: DeleteFolderInput): Promise<boolean> => {
      const apiFolderId = Number(folderId);
      const isValidFolderId =
        Number.isSafeInteger(apiFolderId) && apiFolderId > 0;

      if (isPending || !isValidFolderId) {
        return false;
      }

      const shouldDelete = window.confirm(`"${name}" 폴더를 삭제하시겠습니까?`);

      if (!shouldDelete) {
        return false;
      }

      try {
        await mutateAsync({
          folderId,
          folderParentId,
        });
        return true;
      } catch (error) {
        alert("폴더를 삭제하지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to delete folder", error);
        return false;
      }
    },
    [folderParentId, isPending, mutateAsync],
  );

  return {
    deleteFolder,
    isDeletingFolder: isPending,
  };
}
