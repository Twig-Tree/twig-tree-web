export interface WorkspaceHeaderProps {
  name: string | undefined; // 조회가 끝나기 전에는 undefined
  isNameLoading?: boolean; // 이름을 처음 불러오는 중이라 자리표시자를 보여줄지 여부
}

export function WorkspaceHeader({
  name,
  isNameLoading = false,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-5">
      <h1 className="min-w-0 truncate text-base font-semibold text-slate-900">
        {isNameLoading ? (
          <>
            <span className="sr-only">
              워크스페이스 이름을 불러오는 중입니다.
            </span>
            {/*
            자리표시자의 높이를 text-base의 line-height에 맞춰, 이름이 도착해도 헤더 안에서 흔들리지 않게 한다.
            */}
            <span
              className="block h-6 w-40 animate-pulse rounded-md bg-slate-200"
              aria-hidden="true"
            />
          </>
        ) : (
          name
        )}
      </h1>
    </header>
  );
}
