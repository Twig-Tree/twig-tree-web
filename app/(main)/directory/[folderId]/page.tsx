"use client";

import { use, useState } from "react";
import {
  useGetFolderListQuery,
  useGetFolderQuery,
} from "@/src/entities/folder";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import { routes } from "@/src/shared/config/routes";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";

interface DirectoryPageProps {
  params: Promise<{ folderId: string }>;
}

export default function DirectoryPage({ params }: DirectoryPageProps) {
  const { folderId } = use(params);

  return (
    // App Router의 클라이언트 내비게이션에서는 컴포넌트 상태가 보존될 수 있다.
    // folderId를 key로 사용해 경로가 바뀔 때 아래의 폴더별 로컬 상태를 초기화한다.
    <DirectoryPageContent key={folderId} folderParentId={folderId} />
  );
}

interface DirectoryPageContentProps {
  folderParentId: string;
}

// key로 재마운트할 수 있도록 별도 컴포넌트에서 관리한다.
function DirectoryPageContent({ folderParentId }: DirectoryPageContentProps) {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const folderQuery = useGetFolderQuery(folderParentId);
  const folderListQuery = useGetFolderListQuery(folderParentId);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId,
  });

  const handleCreateFolder = async () => {
    try {
      const createdFolder = await createFolder();
      setEditingFolderId(createdFolder.id);
    } catch {
      // 생성 실패 알림은 useCreateFolder에서 처리한다.
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <DirectoryHeader
          title={folderQuery.data?.name ?? "Folder"}
          breadcrumbs={[
            { label: "Root", href: routes.directoryRoot },
            { label: folderQuery.data?.name ?? "Folder" },
          ]}
          onCreateFolder={() => void handleCreateFolder()}
          isCreateFolderDisabled={isCreateFolderDisabled}
        />
        <DirectoryContentsGrid
          editingFolderId={editingFolderId}
          folderParentId={folderParentId}
          folders={folderListQuery.data ?? []}
          onEditingStart={setEditingFolderId}
          onEditingEnd={() => setEditingFolderId(null)}
          workspaces={[]}
        />
        {folderQuery.isError || folderListQuery.isError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            폴더 정보를 불러오지 못했습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
