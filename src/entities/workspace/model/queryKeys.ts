export const workspaceQueryKeys = {
  all: ["workspace"] as const,

  lists: () => [...workspaceQueryKeys.all, "list"] as const,

  listByFolder: (folderId: string | null) =>
    [...workspaceQueryKeys.lists(), folderId] as const,

  /*
  lists() 아래에 두지 않는다. listByFolder가 그 뒤 자리를 폴더 ID로 쓰므로, 같은 모양의 키가 두 의미를 갖게 된다.
  페이지네이션(#91)이 붙으면 페이지 인자가 이 키 뒤에 붙으므로, 무효화는 이 키를 접두사로 한다.
  */
  recent: () => [...workspaceQueryKeys.all, "recent"] as const,

  details: () => [...workspaceQueryKeys.all, "detail"] as const,

  detail: (workspaceId: string) =>
    [...workspaceQueryKeys.details(), workspaceId] as const,
};
