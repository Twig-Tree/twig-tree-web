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

  /*
  목록 조회가 하나라도 실패하면 그리드를 그리지 않는다. 성공한 쪽만 그리면
  실패한 쪽이 "비어 있음"으로 읽혀, 조회가 실패한 사실이 화면에서 사라진다.
  */
  const isListError = folderListQuery.isError || workspaceListQuery.isError;

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
        {isListError ? null : (
          <DirectoryContentsGrid
            editingFolderId={editingFolderId}
            folderParentId={null}
            folders={folderListQuery.data ?? []}
            onEditingStart={setEditingFolderId}
            onEditingEnd={() => setEditingFolderId(null)}
            workspaces={workspaceListQuery.data ?? []}
          />
        )}
        {isListError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            목록을 불러오지 못했습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
