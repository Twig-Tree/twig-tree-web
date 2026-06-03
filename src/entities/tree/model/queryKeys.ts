export const treeQueryKeys = {
  all: ["tree"] as const,

  lists: () => [...treeQueryKeys.all, "list"] as const,

  detail: (treeId: string) => [...treeQueryKeys.all, "detail", treeId] as const,
};
