export const folderQueryKeys = {
  all: ["folder"] as const,

  lists: () => [...folderQueryKeys.all, "list"] as const,

  detail: (folderId: string) =>
    [...folderQueryKeys.all, "detail", folderId] as const,
};
