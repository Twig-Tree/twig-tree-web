export const folderQueryKeys = {
  all: ["folder"] as const,

  children: () => [...folderQueryKeys.all, "children"] as const,

  childrenByParent: (folderParentId: string | null) =>
    [...folderQueryKeys.children(), folderParentId] as const,

  details: () => [...folderQueryKeys.all, "detail"] as const,

  detail: (folderId: string) =>
    [...folderQueryKeys.details(), folderId] as const,
};
