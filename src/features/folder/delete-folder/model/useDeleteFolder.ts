"use client";

import { useCallback } from "react";
import {
  isValidFolderId,
  useDeleteFolderMutation,
} from "@/src/entities/folder";
import { useInvalidateRecentWorkspaceList } from "@/src/entities/workspace";
import { requestConfirm } from "@/src/shared/ui/confirm-dialog";

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

      /*
      폴더를 지우면 하위 폴더와 그 안의 워크스페이스·트리·노드까지 서버에서 함께 지워지고 되돌릴 수 없어,
      그 사실까지 확인받는다. 비어 보이는 폴더라도 하위 폴더 안에 내용이 있을 수 있어 항상 알린다.
      */
      const shouldDelete = await requestConfirm({
        title: `"${name}" 폴더를 삭제할까요?`,
        description:
          "폴더 안의 하위 폴더와 워크스페이스, 그 안의 트리와 노드도 모두 함께 삭제되며 되돌릴 수 없습니다.",
        confirmLabel: "삭제",
        tone: "danger",
      });

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
