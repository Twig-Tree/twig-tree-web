"use client";

import { use } from "react";
import { useGetFolderListQuery } from "@/src/entities/folder";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";
import { notFound } from "next/navigation";
import { getDirectoryPageData } from "../_data/mockDirectoryData";

interface DirectoryPageProps {
  params: Promise<{ folderId: string }>;
}

export default function DirectoryPage({ params }: DirectoryPageProps) {
  const { folderId } = use(params);
  const directory = getDirectoryPageData(folderId);

  if (!directory) {
    notFound();
  }

  return (
    // App Router의 클라이언트 내비게이션에서는 컴포넌트 상태가 보존될 수 있다.
    // folderId를 key로 사용해 경로가 바뀔 때 아래의 폴더별 로컬 상태를 초기화한다.
    <DirectoryPageContent
      key={folderId}
      directory={directory}
      folderParentId={folderId}
    />
  );
}

interface DirectoryPageContentProps {
  directory: NonNullable<ReturnType<typeof getDirectoryPageData>>;
  folderParentId: string;
}

// key로 재마운트할 수 있도록 별도 컴포넌트에서 관리한다.
function DirectoryPageContent({
  directory,
  folderParentId,
}: DirectoryPageContentProps) {
  const folderListQuery = useGetFolderListQuery(folderParentId);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId,
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <DirectoryHeader
          title={directory.title}
          breadcrumbs={directory.breadcrumbs}
          onCreateFolder={() => void createFolder()}
          isCreateFolderDisabled={isCreateFolderDisabled}
        />
        <DirectoryContentsGrid
          folders={folderListQuery.data ?? []}
          workspaces={directory.workspaces}
        />
        {folderListQuery.isError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            폴더 목록을 불러오지 못했습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
