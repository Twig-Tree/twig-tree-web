"use client";

import { useState } from "react";
import { useGetFolderListQuery } from "@/src/entities/folder";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";

export default function DirectoryRootPage() {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const folderListQuery = useGetFolderListQuery(null);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId: null,
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
          title="Root"
          breadcrumbs={[{ label: "Root" }]}
          onCreateFolder={() => void handleCreateFolder()}
          isCreateFolderDisabled={isCreateFolderDisabled}
        />
        <DirectoryContentsGrid
          editingFolderId={editingFolderId}
          folderParentId={null}
          folders={folderListQuery.data ?? []}
          onEditingEnd={() => setEditingFolderId(null)}
          workspaces={[]}
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
