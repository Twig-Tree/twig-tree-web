"use client";

import { useState } from "react";
import { useGetFolderListQuery } from "@/src/entities/folder";
import { useGetWorkspaceListQuery } from "@/src/entities/workspace";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";

export default function DirectoryRootPage() {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const folderListQuery = useGetFolderListQuery(null);
  const workspaceListQuery = useGetWorkspaceListQuery(null);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId: null,
  });

  const isListError = folderListQuery.isError || workspaceListQuery.isError;
  const isListLoaded =
    folderListQuery.isSuccess && workspaceListQuery.isSuccess;

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
          isError={isListError}
          isLoaded={isListLoaded}
          onEditingStart={setEditingFolderId}
          onEditingEnd={() => setEditingFolderId(null)}
          workspaces={workspaceListQuery.data ?? []}
        />
      </div>
    </div>
  );
}
