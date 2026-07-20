import { FolderCard, type FolderItem } from "@/src/entities/folder";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";

interface DirectoryContentsGridProps {
  folders: FolderItem[];
  workspaces: WorkspaceItem[];
}

export function DirectoryContentsGrid({
  folders,
  workspaces,
}: DirectoryContentsGridProps) {
  return (
    <section
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-label="Directory contents"
    >
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} />
      ))}
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </section>
  );
}
