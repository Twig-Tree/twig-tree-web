/*
함수 이름 : DashboardHero
기능 : 대시보드 상단에서 무엇을 할 수 있는 화면인지 알리는 제목과 설명을 표시한다.
인자 : 없음
반환값 : 대시보드 상단 문구 영역
*/
export function DashboardHero() {
  return (
    <header className="text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-content">
        무엇을 만들어 볼까요?
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-content-muted">
        가지고 있는 자료를 엮어 나만의 지식 트리를 만들어 보세요.
      </p>
    </header>
  );
}
