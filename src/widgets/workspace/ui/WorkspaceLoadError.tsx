import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { Button } from "@/src/shared/ui/button";

/*
없음 안내에는 다시 시도 버튼이 없으므로 onRetry를 요구하지 않는다. 요청 전에 ID 형식으로 걸러진 경우처럼
다시 요청할 query가 없는 호출부도 있다.
*/
export type WorkspaceLoadErrorProps =
  | {
      isNotFound: true; // 다시 요청해도 결과가 같은 오류(404·403)이거나 형식이 잘못된 ID
      onRetry?: () => void;
    }
  | {
      isNotFound: false;
      onRetry: () => void; // 다시 시도 버튼에 연결한다
    };

/*
함수 이름 : WorkspaceLoadError
기능 : 워크스페이스 조회 실패를 안내하고, 오류 종류에 따라 대시보드 이동 또는 다시 시도를 제공한다.
인자 : WorkspaceLoadErrorProps
반환값 : 조회 실패 안내 영역

없는 워크스페이스와 남의 워크스페이스는 같은 안내로 합친다. 남의 워크스페이스가 존재한다는 사실을 따로 알릴 이유가 없다.
*/
export function WorkspaceLoadError({
  isNotFound,
  onRetry,
}: WorkspaceLoadErrorProps) {
  return (
    <section
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-2 px-5 text-center"
    >
      <h1 className="text-lg font-semibold text-slate-900">
        {isNotFound
          ? "워크스페이스를 찾을 수 없습니다"
          : "워크스페이스를 불러오지 못했습니다"}
      </h1>

      <p className="text-sm text-slate-500">
        {isNotFound
          ? "삭제되었거나 접근할 수 없는 워크스페이스입니다."
          : "잠시 후 다시 시도해주세요."}
      </p>

      <div className="mt-4">
        {isNotFound ? (
          /*
          이동은 링크로 둔다. Button은 button 요소라 Link 안에 넣을 수 없어 primary 스타일을 맞춰 적용한다.
          */
          <Link
            href={routes.dashboard}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            대시보드로 이동
          </Link>
        ) : (
          <Button variant="primary" onClick={onRetry}>
            다시 시도
          </Button>
        )}
      </div>
    </section>
  );
}
