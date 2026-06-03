import { treeApi } from "@/src/entities/tree/api/treeApi";
import { NodeDTO } from "@/src/entities/tree/api/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useGetTreeQuery = (treeId: string) => {
  return useQuery<NodeDTO[]>({
    queryKey: treeQueryKeys.detail(treeId),
    queryFn: () => treeApi.getTree(Number(treeId)),
    enabled: !!treeId,
  });
};
