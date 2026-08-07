/*
함수 이름 : DashboardHero
기능 : 대시보드 상단에서 무엇을 할 수 있는 화면인지 알리는 제목과 설명을 표시한다.
인자 : 없음
반환값 : 대시보드 상단 문구 영역
*/
export function DashboardHero() {
  return (
    <header className="text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        What shall we build?
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-500">
        Combine your research files with synthesis to create something
        remarkable.
      </p>
    </header>
  );
}
