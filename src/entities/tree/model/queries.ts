import { treeApi } from "@/src/entities/tree/api/treeApi";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { skipToken, useQuery } from "@tanstack/react-query";

/*
함수 이름 : useGetTreeQuery
기능 : 트리의 노드 목록을 조회한다. 트리가 없는 워크스페이스는 조회하지 않는다.
인자 : string | null treeId -> 조회할 트리 ID. 트리가 없으면 null
반환값 : 트리 노드 목록 query

enabled 대신 skipToken으로 막는다. queryFn 안에서 treeId가 null이 아님을 타입으로 보장받기 위해서다.
검증이 아니라 앞선 워크스페이스 조회 결과에 의존하는 조회라, 조회할 트리가 없으면 요청하지 않는 것이 맞다.
*/
export const useGetTreeQuery = (treeId: string | null) => {
  return useQuery<TreeNode[]>({
    queryKey: treeQueryKeys.detail(treeId),
    queryFn:
      treeId === null ? skipToken : () => treeApi.getTree(Number(treeId)),
  });
};
