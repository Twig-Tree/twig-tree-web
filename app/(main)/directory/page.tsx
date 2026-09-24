"use client";

import { useState } from "react";
import { useGetFolderListQuery } from "@/src/entities/folder";
import { useGetWorkspaceListQuery } from "@/src/entities/workspace";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import { useCreateWorkspace } from "@/src/features/workspace/create-workspace";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";

export default function DirectoryRootPage() {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const folderListQuery = useGetFolderListQuery(null);
  const workspaceListQuery = useGetWorkspaceListQuery(null);
  const { createFolder, isCreateFolderDisabled } = useCreateFolder({
    folders: folderListQuery.data,
    folderParentId: null,
  });
  const { createWorkspace, isCreateWorkspaceDisabled } = useCreateWorkspace({
    folderId: null,
    workspaces: workspaceListQuery.data,
  });

  const isListError = folderListQuery.isError || workspaceListQuery.isError;
  const isListLoaded =
    folderListQuery.isSuccess && workspaceListQuery.isSuccess;
  const isListLoading =
    folderListQuery.isLoading || workspaceListQuery.isLoading;

  /*
  편집 카드는 화면에 하나만 둔다. 한쪽 편집을 시작하면 다른 쪽 편집은 끝낸다.
  */
  const startFolderEditing = (folderId: string) => {
    setEditingWorkspaceId(null);
    setEditingFolderId(folderId);
  };

  const startWorkspaceEditing = (workspaceId: string) => {
    setEditingFolderId(null);
    setEditingWorkspaceId(workspaceId);
  };

  const endEditing = () => {
    setEditingFolderId(null);
    setEditingWorkspaceId(null);
  };

  const handleCreateFolder = async () => {
    try {
      const createdFolder = await createFolder();
      startFolderEditing(createdFolder.id);
    } catch {
      // 생성 실패 알림은 useCreateFolder에서 처리한다.
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const createdWorkspace = await createWorkspace();
      startWorkspaceEditing(createdWorkspace.id);
    } catch {
      // 생성 실패 알림은 useCreateWorkspace에서 처리한다.
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
          onCreateWorkspace={() => void handleCreateWorkspace()}
          isCreateWorkspaceDisabled={isCreateWorkspaceDisabled}
        />
        <DirectoryContentsGrid
          editingFolderId={editingFolderId}
          editingWorkspaceId={editingWorkspaceId}
          folderParentId={null}
          folders={folderListQuery.data ?? []}
          isError={isListError}
          isLoaded={isListLoaded}
          isLoading={isListLoading}
          onFolderEditingStart={startFolderEditing}
          onEditingEnd={endEditing}
          onWorkspaceEditingStart={startWorkspaceEditing}
          workspaces={workspaceListQuery.data ?? []}
        />
      </div>
    </div>
  );
}
