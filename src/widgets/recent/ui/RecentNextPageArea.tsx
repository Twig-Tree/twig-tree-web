"use client";

import { useOnVisible } from "@/src/shared/lib/react/useOnVisible";
import { Button } from "@/src/shared/ui/button";
import { CardGridSkeleton } from "@/src/shared/ui/card-grid-skeleton";

const NEXT_PAGE_SKELETON_CARD_COUNT = 4; // 가장 넓은 그리드(2xl:grid-cols-4)의 한 줄

interface RecentNextPageAreaProps {
  gridClassName: string; // 목록과 같은 그리드 설정. 자리표시자가 목록 끝에 이어 붙은 것처럼 보이게 한다
  hasNextPage: boolean; // 서버에 다음 페이지가 남아 있는지 여부
  isFetching: boolean; // 다음 페이지 조회와 무효화 후 재조회를 포함해 조회가 진행 중인지 여부
  isFetchingNextPage: boolean; // 다음 페이지를 조회하는 중인지 여부
  isFetchNextPageError: boolean; // 마지막 다음 페이지 조회가 실패했는지 여부
  onLoadMore: () => void; // 다음 페이지를 조회할 때 부른다
}

/*
함수 이름 : RecentNextPageArea
기능 : 최신순 목록 끝에서 다음 페이지 조회를 시작하고, 조회 중·실패 상태를 목록 아래에 알린다.
인자 : RecentNextPageAreaProps
반환값 : 감지 요소, 다음 페이지 자리표시자, 실패 안내 중 하나. 다음 페이지가 없으면 아무것도 그리지 않는다

감지 요소는 조회가 진행 중이 아닐 때만 그린다.
- 다음 페이지를 받는 중에 또 부르지 않는다.
- 무효화 후 재조회 중에 부르면 TanStack Query가 그 재조회를 취소한다.
조회가 끝나면 감지 요소가 새로 그려져 observer가 다시 붙으므로, 받은 페이지가 화면을 다 채우지 못해
감지 요소가 계속 보이는 경우에도 다음 페이지를 이어서 부른다.

실패한 뒤에는 감지 요소를 그리지 않는다. 스크롤할 때마다 실패한 요청을 반복하지 않도록 재시도는 버튼으로만 한다.
*/
export function RecentNextPageArea({
  gridClassName,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: RecentNextPageAreaProps) {
  const sentinelRef = useOnVisible<HTMLDivElement>(onLoadMore);

  if (isFetchNextPageError) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p role="alert" className="text-sm font-medium text-red-600">
          다음 목록을 불러오지 못했습니다.
        </p>
        <Button onClick={onLoadMore}>다시 시도</Button>
      </div>
    );
  }

  if (isFetchingNextPage) {
    return (
      <CardGridSkeleton
        cardCount={NEXT_PAGE_SKELETON_CARD_COUNT}
        gridClassName={gridClassName}
      />
    );
  }

  if (hasNextPage && !isFetching) {
    return <div ref={sentinelRef} aria-hidden="true" className="h-px" />;
  }

  return null;
}
