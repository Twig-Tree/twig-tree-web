import { useMemo } from "react";
import {
  matchMutation,
  useIsFetching,
  useIsMutating,
  useQueryClient,
} from "@tanstack/react-query";
import { TreeNode } from "@/src/entities/tree/model/types";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";

/*
함수 이름 : useTreeRequestTracker
기능 : 다른 곳의 변경을 찾는 쪽에 트리 조회 캐시와 이 탭의 트리 요청 상태를 알려 준다. 캐시 키와 mutation 키는 캐시 소유자인 이 slice만 알도록 여기에 모은다.
인자 : string | null treeId -> 조회할 트리 ID. 트리가 없으면 null
반환값 : 요청 진행 여부와 캐시를 읽고 다시 조회하고 mutation 시작을 구독하는 함수들

렌더에 묶이는 isRequestActive는 끝난 시점을 알기 위해 쓰고, 나머지 함수는 이벤트 시점의 최신 값을 읽는다. 렌더 값은 캐시 변경보다 늦게 반영되어 비교 기준으로 쓸 수 없다.
*/
export const useTreeRequestTracker = (treeId: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = treeQueryKeys.detail(treeId);
  const mutationKey = treeQueryKeys.mutations();

  const fetchingCount = useIsFetching({ queryKey, exact: true });
  const mutatingCount = useIsMutating({ mutationKey });

  const tracker = useMemo(() => {
    const treeQueryKey = treeQueryKeys.detail(treeId);
    const treeMutationKey = treeQueryKeys.mutations();

    return {
      getCachedTree: () => queryClient.getQueryData<TreeNode[]>(treeQueryKey),

      hasActiveRequest: () =>
        queryClient.isMutating({ mutationKey: treeMutationKey }) > 0 ||
        queryClient.isFetching({ queryKey: treeQueryKey, exact: true }) > 0,

      /*
      이미 진행 중인 조회가 있으면 끊지 않고 그 결과를 함께 기다린다. 실패는 호출부가 비교를 건너뛸 수 있게 던진다.
      */
      refetchTree: () =>
        queryClient.refetchQueries(
          { queryKey: treeQueryKey, exact: true },
          { cancelRefetch: false, throwOnError: true },
        ),

      subscribeMutationStart: (listener: () => void) =>
        queryClient.getMutationCache().subscribe((event) => {
          if (
            event.type === "added" &&
            matchMutation({ mutationKey: treeMutationKey }, event.mutation)
          ) {
            listener();
          }
        }),
    };
  }, [queryClient, treeId]);

  return { ...tracker, isRequestActive: fetchingCount + mutatingCount > 0 };
};
