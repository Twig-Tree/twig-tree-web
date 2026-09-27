// 첫 화면에서 한 줄 이상을 채워 빈 화면으로 보이지 않게 하는 자리표시자 개수
const SKELETON_CARD_COUNT = 4;

interface CardGridSkeletonProps {
  ariaLabel: string; // 목록이 도착했을 때 그 자리를 채울 영역의 이름. 조회 전후로 같은 이름을 써야 보조기기가 같은 영역으로 읽는다
}

/*
함수 이름 : CardGridSkeleton
기능 : 카드 목록을 불러오는 동안 카드 자리를 채워 조회 중임을 알린다.
인자 : CardGridSkeletonProps
반환값 : 자리표시자 카드 그리드

폴더·워크스페이스 카드와 같은 그리드 설정과 최소 높이를 써서, 목록이 도착해도 레이아웃이 흔들리지 않게 한다.
자리표시자에는 읽을 내용이 없으므로 aria-hidden으로 감추고 진행 상태는 문구로 알린다.
*/
export function CardGridSkeleton({ ariaLabel }: CardGridSkeletonProps) {
  return (
    <section aria-label={ariaLabel} aria-busy="true">
      <span className="sr-only">목록을 불러오는 중입니다.</span>
      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        aria-hidden="true"
      >
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <div
            key={index}
            className="flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <span className="block h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <span className="block h-3 w-1/3 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
