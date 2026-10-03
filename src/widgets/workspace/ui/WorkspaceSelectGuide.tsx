import Link from "next/link";
import { routes } from "@/src/shared/config/routes";

/*
함수 이름 : WorkspaceSelectGuide
기능 : 워크스페이스를 고르지 않고 워크스페이스 화면에 들어왔을 때, 디렉토리에서 고르도록 안내한다.
인자 : 없음
반환값 : 워크스페이스 선택 안내 영역

사이드바의 Workspace 항목처럼 특정 워크스페이스 없이 들어오는 경로가 있다. 열 워크스페이스를 정할 수 없으므로
자동으로 하나를 고르지 않고, 워크스페이스가 모여 있는 디렉토리로 보낸다.
*/
export function WorkspaceSelectGuide() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center gap-2 px-5 text-center">
      <h1 className="text-lg font-semibold text-slate-900">
        조회할 워크스페이스를 선택해주세요
      </h1>

      <p className="text-sm text-slate-500">
        디렉토리에서 워크스페이스를 열 수 있습니다.
      </p>

      <div className="mt-4">
        {/*
        이동은 링크로 둔다. WorkspaceLoadError와 같은 이유로 primary 스타일을 맞춰 적용한다.
        */}
        <Link
          href={routes.directoryRoot}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          디렉토리로 이동
        </Link>
      </div>
    </section>
  );
}
