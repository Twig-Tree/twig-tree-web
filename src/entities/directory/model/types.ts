type DirectoryItemBase = {
  id: string;
  name: string;
};

export type FolderItem = DirectoryItemBase & {
  type: "folder";
};

export type WorkspaceItem = DirectoryItemBase & {
  type: "workspace";
  modifiedAt: string;
};

export type DirectoryItem = FolderItem | WorkspaceItem;
