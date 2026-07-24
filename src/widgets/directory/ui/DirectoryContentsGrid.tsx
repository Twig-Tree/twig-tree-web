import { FolderCard, type FolderItem } from "@/src/entities/folder";
import { EditableFolderCard } from "@/src/features/folder/update-folder";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";

interface DirectoryContentsGridProps {
  editingFolderId: string | null;
  folderParentId: string | null;
  folders: FolderItem[];
  onEditingEnd: () => void;
  workspaces: WorkspaceItem[];
}

export function DirectoryContentsGrid({
  editingFolderId,
  folderParentId,
  folders,
  onEditingEnd,
  workspaces,
}: DirectoryContentsGridProps) {
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
          <FolderCard key={folder.id} folder={folder} />
        ),
      )}
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </section>
  );
}
