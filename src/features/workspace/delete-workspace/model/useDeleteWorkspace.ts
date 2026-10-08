"use client";

import { useCallback } from "react";
import { isValidFolderId } from "@/src/entities/folder";
import {
  type WorkspaceItem,
  useDeleteWorkspaceMutation,
} from "@/src/entities/workspace";

/*
함수 이름 : useDeleteWorkspace
기능 : 사용자에게 삭제 여부를 확인받은 뒤 워크스페이스 삭제 요청을 보내고, 실패하면 알린다.
인자 : 없음
반환값 : 워크스페이스 삭제 핸들러, 삭제 요청 중 여부

폴더 ID는 hook 인자가 아니라 삭제할 항목에서 읽는다. 최신순 화면처럼 폴더를 가로지르는 목록에서는
항목마다 갱신할 폴더 목록 캐시가 다르다.
*/
export function useDeleteWorkspace() {
  const { mutateAsync, isPending } = useDeleteWorkspaceMutation();

  /*
  삭제에 성공하면 true를 돌려준다. 취소했거나 요청하지 못했으면 false다.
  */
  const deleteWorkspace = useCallback(
    async ({ id, name, folderId }: WorkspaceItem): Promise<boolean> => {
      if (isPending || !isValidFolderId(folderId)) {
        return false;
      }

      /*
      워크스페이스를 지우면 안의 트리와 노드도 서버에서 함께 지워지고 되돌릴 수 없어, 그 사실까지 확인받는다.
      */
      const shouldDelete = window.confirm(
        `"${name}" 워크스페이스를 삭제하시겠습니까?\n워크스페이스 안의 트리와 노드도 함께 삭제되며 되돌릴 수 없습니다.`,
      );

      if (!shouldDelete) {
        return false;
      }

      try {
        await mutateAsync({ workspaceId: id, folderId });
        return true;
      } catch (error) {
        alert("워크스페이스를 삭제하지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to delete workspace", error);
        return false;
      }
    },
    [isPending, mutateAsync],
  );

  return {
    deleteWorkspace,
    isDeletingWorkspace: isPending,
  };
}
