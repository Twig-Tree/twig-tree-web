import Link from "next/link";
import { routes } from "@/src/shared/config/routes";

/*
함수 이름 : DirectoryNotFound
기능 : 열 수 없는 폴더 주소로 들어왔을 때 안내하고 디렉토리 루트로 이동할 링크를 제공한다.
인자 : 없음
반환값 : 폴더 없음 안내 영역

WorkspaceLoadError의 없음 안내와 같은 모양을 쓴다. 지금은 형식이 잘못된 ID에만 쓰인다.
형식은 맞지만 서버에 없는 폴더는 헤더와 그리드가 각자 조회 오류로 보여준다.
*/
export function DirectoryNotFound() {
  return (
    <section
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-2 px-5 text-center"
    >
      <h1 className="text-lg font-semibold text-slate-900">
        폴더를 찾을 수 없습니다
      </h1>

      <p className="text-sm text-slate-500">
        삭제되었거나 접근할 수 없는 폴더입니다.
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
