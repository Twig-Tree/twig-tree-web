"use client";

import { FolderCard, type FolderItem } from "@/src/entities/folder";
import { useDeleteFolder } from "@/src/features/folder/delete-folder";
import { EditableFolderCard } from "@/src/features/folder/update-folder";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";

interface DirectoryContentsGridProps {
  editingFolderId: string | null;
  folderParentId: string | null;
  folders: FolderItem[];
  onEditingStart: (folderId: string) => void;
  onEditingEnd: () => void;
  workspaces: WorkspaceItem[];
}

export function DirectoryContentsGrid({
  editingFolderId,
  folderParentId,
  folders,
  onEditingStart,
  onEditingEnd,
  workspaces,
}: DirectoryContentsGridProps) {
  const { deleteFolder, isDeletingFolder } = useDeleteFolder({
    folderParentId,
  });

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
