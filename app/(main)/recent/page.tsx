"use client";

import { useRouter } from "next/navigation";
import { useGetRecentWorkspaceListQuery } from "@/src/entities/workspace";
import { useCreateWorkspace } from "@/src/features/workspace/create-workspace";
import { routes } from "@/src/shared/config/routes";
import { RecentHeader, RecentWorkspaceGrid } from "@/src/widgets/recent";

export default function RecentPage() {
  const router = useRouter();
  const recentWorkspaceListQuery = useGetRecentWorkspaceListQuery();
  const { createWorkspace, isCreateWorkspaceDisabled } = useCreateWorkspace();

  /*
  만든 워크스페이스는 이 화면 목록 맨 위에도 생기지만, 최신순 카드에는 이름 수정 메뉴가 없다(#90).
  기본 이름으로 만들어져 바로 고치는 경우가 많으므로, 메뉴가 있는 그 폴더의 디렉토리 화면으로 옮긴다.
  #90으로 메뉴가 붙으면 이동을 걷어내고 이 화면에 머무른다.
  */
  const handleSelectFolderPath = async (folderParentId: string | null) => {
    try {
      await createWorkspace(folderParentId);
      router.push(
        folderParentId === null
          ? routes.directoryRoot
          : routes.directory(folderParentId),
      );
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
          isError={recentWorkspaceListQuery.isError}
          isLoaded={recentWorkspaceListQuery.isSuccess}
          isLoading={recentWorkspaceListQuery.isLoading}
          workspaces={recentWorkspaceListQuery.data ?? []}
        />
      </div>
    </div>
  );
}
