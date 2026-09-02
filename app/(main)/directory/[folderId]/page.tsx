"use client";

import { use, useState } from "react";
import {
  useGetFolderListQuery,
  useGetFolderPathQuery,
} from "@/src/entities/folder";
import { useGetWorkspaceListQuery } from "@/src/entities/workspace";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import { routes } from "@/src/shared/config/routes";
import type { BreadcrumbItem } from "@/src/shared/ui/breadcrumb";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";

// 경로 조회에 실패해 폴더 이름을 알 수 없을 때 제목 자리에 표시할 이름
const FALLBACK_FOLDER_NAME = "Folder";

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
  const folderPathQuery = useGetFolderPathQuery(folderParentId);
  const folderListQuery = useGetFolderListQuery(folderParentId);
  const workspaceListQuery = useGetWorkspaceListQuery(folderParentId);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId,
  });

  /*
  경로는 루트부터 현재 폴더까지 순서대로 오므로 마지막 항목이 현재 폴더다.
  마지막 항목에는 링크를 걸지 않는다. Breadcrumb은 href가 없는 항목을 현재 위치로 표시한다.
  */
  const folderPath = folderPathQuery.data ?? [];
  const currentFolderName = folderPath.at(-1)?.name ?? FALLBACK_FOLDER_NAME;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Root", href: routes.directoryRoot },
    ...folderPath.map(({ id, name }, index) => ({
      label: name,
      href: index === folderPath.length - 1 ? undefined : routes.directory(id),
    })),
  ];

  const isListError = folderListQuery.isError || workspaceListQuery.isError;
  const isListLoaded =
    folderListQuery.isSuccess && workspaceListQuery.isSuccess;
  const isListLoading =
    folderListQuery.isLoading || workspaceListQuery.isLoading;

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
          title={currentFolderName}
          breadcrumbs={breadcrumbs}
          isTitleLoading={folderPathQuery.isLoading}
          isPathError={folderPathQuery.isError}
          onCreateFolder={() => void handleCreateFolder()}
          isCreateFolderDisabled={isCreateFolderDisabled}
        />
        <DirectoryContentsGrid
          editingFolderId={editingFolderId}
          folderParentId={folderParentId}
          folders={folderListQuery.data ?? []}
          isError={isListError}
          isLoaded={isListLoaded}
          isLoading={isListLoading}
          onEditingStart={setEditingFolderId}
          onEditingEnd={() => setEditingFolderId(null)}
          workspaces={workspaceListQuery.data ?? []}
        />
      </div>
    </div>
  );
}
