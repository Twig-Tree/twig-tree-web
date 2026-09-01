export const workspaceQueryKeys = {
  all: ["workspace"] as const,

  lists: () => [...workspaceQueryKeys.all, "list"] as const,

  listByFolder: (folderId: string | null) =>
    [...workspaceQueryKeys.lists(), folderId] as const,
};
