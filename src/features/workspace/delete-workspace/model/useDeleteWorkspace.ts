"use client";

import { useCallback } from "react";
import { isValidFolderId } from "@/src/entities/folder";
import { useDeleteWorkspaceMutation } from "@/src/entities/workspace";

interface UseDeleteWorkspaceParams {
  folderId: string | null; // 삭제할 워크스페이스들이 속한 폴더 ID. 삭제 후 이 폴더의 목록 캐시를 갱신한다. 루트는 null
}

interface DeleteWorkspaceInput {
  workspaceId: string; // 삭제할 워크스페이스 ID
  name: string; // 확인 문구에 보여줄 워크스페이스 이름
}

/*
함수 이름 : useDeleteWorkspace
기능 : 사용자에게 삭제 여부를 확인받은 뒤 워크스페이스 삭제 요청을 보내고, 실패하면 알린다.
인자 : UseDeleteWorkspaceParams
반환값 : 워크스페이스 삭제 핸들러, 삭제 요청 중 여부
*/
export function useDeleteWorkspace({ folderId }: UseDeleteWorkspaceParams) {
  const { mutateAsync, isPending } = useDeleteWorkspaceMutation();

  /*
  삭제에 성공하면 true를 돌려준다. 취소했거나 요청하지 못했으면 false다.
  */
  const deleteWorkspace = useCallback(
    async ({ workspaceId, name }: DeleteWorkspaceInput): Promise<boolean> => {
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
        await mutateAsync({ workspaceId, folderId });
        return true;
      } catch (error) {
        alert("워크스페이스를 삭제하지 못했습니다. 다시 시도해 주세요.");
        console.error("Failed to delete workspace", error);
        return false;
      }
    },
    [folderId, isPending, mutateAsync],
  );

  return {
    deleteWorkspace,
    isDeletingWorkspace: isPending,
  };
}
