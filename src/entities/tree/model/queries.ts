import { useCallback } from "react";
import { nodeApi } from "@/src/entities/tree/api/nodeApi";
import { tagApi } from "@/src/entities/tree/api/tagApi";
import { treeApi } from "@/src/entities/tree/api/treeApi";
import { TreeNode, TreeTag } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

type FetchLatestNodeParams = {
  treeId: string; // 노드가 속한 트리 ID
  nodeId: string; // 조회할 노드 ID
};

/*
함수 이름 : useFetchLatestNode
기능 : 서버에서 단일 노드의 최신 값을 읽는 함수를 만든다. 저장이 version 충돌로 거절됐을 때만 쓰므로 렌더에 묶지 않고 필요한 순간에 호출한다.
인자 : 없음
반환값 : FetchLatestNodeParams를 받아 최신 노드를 돌려주는 함수

충돌 직후의 값이 필요하므로 항상 요청을 보내고 결과를 캐시에 남기지 않는다.
*/
export const useFetchLatestNode = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ treeId, nodeId }: FetchLatestNodeParams) =>
      queryClient.fetchQuery<TreeNode>({
        queryKey: treeQueryKeys.node(treeId, nodeId),
        queryFn: () => nodeApi.getNode(Number(treeId), Number(nodeId)),
        staleTime: 0,
        gcTime: 0,
      }),
    [queryClient],
  );
};

/*
함수 이름 : useGetTreeQuery
기능 : 트리의 노드 목록을 조회한다. 트리가 없는 워크스페이스는 조회하지 않는다.
인자 : string | null treeId -> 조회할 트리 ID. 트리가 없으면 null
반환값 : 트리 노드 목록 query

enabled 대신 skipToken으로 막는다. queryFn 안에서 treeId가 null이 아님을 타입으로 보장받기 위해서다.
검증이 아니라 앞선 워크스페이스 조회 결과에 의존하는 조회라, 조회할 트리가 없으면 요청하지 않는 것이 맞다.

포커스 재조회는 라이브러리에 맡기지 않는다. 다른 곳의 변경을 찾으려면 재조회 직전의 캐시와 결과를 비교해야 하는데,
라이브러리가 재조회하면 비교 기준을 잡기 전에 캐시가 덮이고 이 탭의 무효화 재조회와도 구분할 수 없다.
*/
export const useGetTreeQuery = (treeId: string | null) => {
  return useQuery<TreeNode[]>({
    queryKey: treeQueryKeys.detail(treeId),
    queryFn:
      treeId === null ? skipToken : () => treeApi.getTree(Number(treeId)),
    refetchOnWindowFocus: false,
  });
};

/*
함수 이름 : useGetTreeTagsQuery
기능 : 트리에 속한 태그 목록을 조회한다. 트리가 없는 워크스페이스는 조회하지 않는다.
인자 : string | null treeId -> 조회할 트리 ID. 트리가 없으면 null
반환값 : 트리 태그 목록 query

useGetTreeQuery와 같은 이유로 skipToken으로 막는다.

화면이 이 캐시에서 바로 그리므로 탭으로 돌아올 때마다 다시 읽는다. 다른 곳에서 만든 태그가 노드에 붙어 왔을 때 목록에 없으면 칩이 비어 보인다.
*/
export const useGetTreeTagsQuery = (treeId: string | null) => {
  return useQuery<TreeTag[]>({
    queryKey: treeQueryKeys.tags(treeId),
    queryFn:
      treeId === null ? skipToken : () => tagApi.getTreeTags(Number(treeId)),
    refetchOnWindowFocus: "always",
  });
};
