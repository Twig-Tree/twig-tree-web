"use client";

import { FolderCard, type FolderItem } from "@/src/entities/folder";
import { useDeleteFolder } from "@/src/features/folder/delete-folder";
import { EditableFolderCard } from "@/src/features/folder/update-folder";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";

interface DirectoryContentsGridProps {
  editingFolderId: string | null;
  folderParentId: string | null;
  folders: FolderItem[];
  isError: boolean; // 폴더와 워크스페이스 목록 중 하나라도 조회에 실패했는지 여부
  isLoaded: boolean; // 두 목록이 모두 도착했는지 여부. 빈 상태 안내를 언제 보여줄지 정한다
  onEditingStart: (folderId: string) => void;
  onEditingEnd: () => void;
  workspaces: WorkspaceItem[];
}

export function DirectoryContentsGrid({
  editingFolderId,
  folderParentId,
  folders,
  isError,
  isLoaded,
  onEditingStart,
  onEditingEnd,
  workspaces,
}: DirectoryContentsGridProps) {
  const { deleteFolder, isDeletingFolder } = useDeleteFolder({
    folderParentId,
  });

  /*
  한쪽만 실패해도 아무것도 그리지 않는다. 성공한 쪽만 그리면 실패한 쪽이
  "비어 있음"으로 읽혀, 조회가 실패한 사실이 화면에서 사라진다.
  */
  if (isError) {
    return (
      <section aria-label="Directory contents">
        <p role="alert" className="text-sm font-medium text-red-600">
          목록을 불러오지 못했습니다.
        </p>
      </section>
    );
  }

  /*
  목록이 도착한 뒤에만 빈 상태를 알린다. 아직 조회 중이거나 query가 비활성이면
  둘 다 빈 배열이지만 비어 있다고 확인된 것이 아니다.

  두 목록이 모두 비었을 때만 해당한다. 그리드가 폴더와 워크스페이스를 함께 그리므로
  한쪽만 비어 있는 것은 빈 화면이 아니다.
  */
  if (isLoaded && folders.length === 0 && workspaces.length === 0) {
    return (
      <section aria-label="Directory contents">
        <p className="text-sm text-slate-500">
          아직 폴더나 워크스페이스가 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-label="Directory contents"
    >
      {folders.map((folder) =>
        folder.id !== null && folder.id === editingFolderId ? (
          <EditableFolderCard
            key={folder.id}
            folder={{ ...folder, id: folder.id }}
            folders={folders}
            folderParentId={folderParentId}
            onEditingEnd={onEditingEnd}
          />
        ) : (
          <FolderCard
            key={folder.id}
            folder={folder}
            onDelete={
              folder.id === null || isDeletingFolder
                ? undefined
                : () => {
                    void deleteFolder({
                      folderId: folder.id as string,
                      name: folder.name,
                    });
                  }
            }
            onRename={() => {
              if (folder.id !== null) {
                onEditingStart(folder.id);
              }
            }}
          />
        ),
      )}
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </section>
  );
}
