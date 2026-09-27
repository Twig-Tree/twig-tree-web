"use client";

import { useCallback } from "react";
import {
  isValidFolderId,
  useDeleteFolderMutation,
} from "@/src/entities/folder";
import { useInvalidateRecentWorkspaceList } from "@/src/entities/workspace";

interface UseDeleteFolderParams {
  folderParentId: string | null;
}

interface DeleteFolderInput {
  folderId: string;
  name: string;
}

export function useDeleteFolder({ folderParentId }: UseDeleteFolderParams) {
  const { mutateAsync, isPending } = useDeleteFolderMutation();
  const invalidateRecentWorkspaceList = useInvalidateRecentWorkspaceList();

  const deleteFolder = useCallback(
    async ({ folderId, name }: DeleteFolderInput): Promise<boolean> => {
      if (isPending || !isValidFolderId(folderId)) {
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
      } catch (error) {
        alert("폴더를 삭제하지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to delete folder", error);
        return false;
      }

      /*
      폴더를 지우면 안의 워크스페이스도 DB에서 함께 지워진다(FK ON DELETE CASCADE).
      폴더는 워크스페이스의 부모라 폴더 mutation이 워크스페이스 캐시를 건드리지 않으므로, 여기서 조합한다.
      삭제 실패 알림과 섞이지 않도록 try 밖에 둔다. 무효화는 재조회가 실패해도 reject하지 않는다.
      */
      await invalidateRecentWorkspaceList();
      return true;
    },
    [folderParentId, invalidateRecentWorkspaceList, isPending, mutateAsync],
  );

  return {
    deleteFolder,
    isDeletingFolder: isPending,
  };
}
