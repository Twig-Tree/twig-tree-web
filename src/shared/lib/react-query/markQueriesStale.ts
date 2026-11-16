import type { QueryClient, QueryFilters } from "@tanstack/react-query";

/*
함수 이름 : markQueriesStale
기능 : 진행 중인 조회를 취소한 뒤, 다시 조회하지 않고 낡음으로만 표시한다.
인자 : QueryClient queryClient -> 캐시를 가진 QueryClient
QueryFilters[] filters -> 낡음으로 표시할 query 범위
반환값 : 취소와 표시가 끝나면 resolve하는 Promise

서버가 아직 바꾸지 않았을 수 있는 데이터를 지금 다시 받지 않고, 다음 창 포커스나 화면 재진입 때 받게 할 때 쓴다.
invalidateQueries는 진행 중인 조회를 멈추지 않고, 그 조회가 성공하면 낡음 표시를 지운다.
그래서 먼저 취소한다. 취소는 조회 시작 전 상태로 되돌리므로, 표시를 먼저 하면 그 표시까지 되돌아가 순서를 바꿀 수 없다.
*/
export const markQueriesStale = async (
  queryClient: QueryClient,
  filters: QueryFilters[],
): Promise<void> => {
  await Promise.all(filters.map((filter) => queryClient.cancelQueries(filter)));

  await Promise.all(
    filters.map((filter) =>
      queryClient.invalidateQueries({ ...filter, refetchType: "none" }),
    ),
  );
};
