"use client";

import { useGetFolderListQuery } from "@/src/entities/folder";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";
import { getRootDirectoryPageData } from "./_data/mockDirectoryData";

export default function DirectoryRootPage() {
  const directory = getRootDirectoryPageData();
  const folderListQuery = useGetFolderListQuery(null);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId: null,
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
