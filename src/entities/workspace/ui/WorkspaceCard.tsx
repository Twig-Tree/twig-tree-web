import type { WorkspaceItem } from "../model/types";

interface WorkspaceCardProps {
  headingLevel?: 2 | 3; // 카드가 놓인 위치의 제목 깊이. 섹션 제목 아래에 놓이면 3을 지정한다
  workspace: WorkspaceItem;
}

/*
함수 이름 : WorkspaceCard
기능 : 워크스페이스 이름과 마지막 수정 시점을 카드 형태로 표시한다.
인자 : WorkspaceCardProps
반환값 : 워크스페이스 카드 요소

카드가 페이지 제목 바로 아래에 오는지 섹션 제목 아래에 오는지에 따라 제목 레벨이 달라져야 하므로,
화면 구조를 아는 상위에서 headingLevel을 지정한다.
*/
export function WorkspaceCard({
  headingLevel = 2,
  workspace,
}: WorkspaceCardProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <article className="flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <Heading className="text-base font-semibold leading-snug text-slate-800">
        {workspace.name}
      </Heading>
      <p className="text-xs text-slate-500">Modified {workspace.modifiedAt}</p>
    </article>
  );
}
