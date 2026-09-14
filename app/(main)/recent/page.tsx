"use client";

import { useRouter } from "next/navigation";
import { useCreateWorkspace } from "@/src/features/workspace/create-workspace";
import { routes } from "@/src/shared/config/routes";
import { RecentHeader } from "@/src/widgets/recent";

export default function RecentPage() {
  const router = useRouter();
  const { createWorkspace, isCreateWorkspaceDisabled } = useCreateWorkspace();

  /*
  최신순 화면에는 아직 워크스페이스 목록이 없어(#62 대기) 생성 결과가 이 화면에
  남지 않는다. 만든 것이 보이는 그 폴더의 디렉토리 화면으로 옮겨 확인시킨다.
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
      </div>
    </div>
  );
}
