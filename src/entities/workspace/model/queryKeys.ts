export const workspaceQueryKeys = {
  all: ["workspace"] as const,

  lists: () => [...workspaceQueryKeys.all, "list"] as const,

  listByFolder: (folderId: string | null) =>
    [...workspaceQueryKeys.lists(), folderId] as const,

  /*
  lists() 아래에 두지 않는다. listByFolder가 그 뒤 자리를 폴더 ID로 쓰므로, 같은 모양의 키가 두 의미를 갖게 된다.
  최신순 목록의 실제 query는 아래 두 키를 쓴다. 무효화는 이 키를 접두사로 해 둘을 함께 무효화한다.
  */
  recent: () => [...workspaceQueryKeys.all, "recent"] as const,

  /*
  첫 페이지 query와 infinite query는 캐시에 담는 모양이 달라(페이지 하나 / { pages, pageParams }) 같은 키를 쓸 수 없다.
  페이지 크기가 다르면 받은 목록도 다르므로 크기를 키에 넣는다.
  */
  recentFirstPage: (size: number) =>
    [...workspaceQueryKeys.recent(), "first-page", size] as const,

  recentInfinite: (size: number) =>
    [...workspaceQueryKeys.recent(), "infinite", size] as const,

  details: () => [...workspaceQueryKeys.all, "detail"] as const,

  detail: (workspaceId: string) =>
    [...workspaceQueryKeys.details(), workspaceId] as const,
};
