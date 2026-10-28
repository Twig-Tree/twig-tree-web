export const treeQueryKeys = {
  all: ["tree"] as const,

  lists: () => [...treeQueryKeys.all, "list"] as const,

  // 트리가 없으면 null. 이 키로는 조회를 보내지 않으므로 캐시가 채워지지 않는다
  detail: (treeId: string | null) =>
    [...treeQueryKeys.all, "detail", treeId] as const,

  // 트리 태그 목록. detail과 같은 이유로 트리가 없으면 null
  tags: (treeId: string | null) =>
    [...treeQueryKeys.all, "tags", treeId] as const,
};
