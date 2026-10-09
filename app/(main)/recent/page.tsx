"use client";

import { useState } from "react";
import { useGetRecentWorkspaceInfiniteQuery } from "@/src/entities/workspace";
import { useCreateWorkspace } from "@/src/features/workspace/create-workspace";
import {
  RECENT_WORKSPACE_PAGE_SIZE,
  RecentHeader,
  RecentWorkspaceGrid,
} from "@/src/widgets/recent";

export default function RecentPage() {
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const recentWorkspaceListQuery = useGetRecentWorkspaceInfiniteQuery(
    RECENT_WORKSPACE_PAGE_SIZE,
  );
  const { createWorkspace, isCreateWorkspaceDisabled } = useCreateWorkspace();

  /*
  만든 워크스페이스는 기본 이름이라 바로 고치는 경우가 많으므로 편집 상태로 둔다.
  생성 mutation이 최신순 목록 재조회까지 기다린 뒤 끝나므로, 이 시점에는 목록 맨 위에 새 카드가 있다.
  */
  const handleSelectFolderPath = async (folderParentId: string | null) => {
    try {
      const createdWorkspace = await createWorkspace(folderParentId);
      setEditingWorkspaceId(createdWorkspace.id);
    } catch {
      // 생성 실패 알림은 useCreateWorkspace에서 처리한다.
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <RecentHeader
          onSelectFolderPath={(folderParentId) =>
            void handleSelectFolderPath(folderParentId)
          }
          isCreateWorkspaceDisabled={isCreateWorkspaceDisabled}
        />

        <RecentWorkspaceGrid
          editingWorkspaceId={editingWorkspaceId}
          isError={recentWorkspaceListQuery.isError}
          isLoaded={recentWorkspaceListQuery.isSuccess}
          isLoading={recentWorkspaceListQuery.isLoading}
          onEditingEnd={() => setEditingWorkspaceId(null)}
          onWorkspaceEditingStart={setEditingWorkspaceId}
          workspaces={recentWorkspaceListQuery.data ?? []}
        />
      </div>
    </div>
  );
}
