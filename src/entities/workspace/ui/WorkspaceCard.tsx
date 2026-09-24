import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { KebabMenu } from "@/src/shared/ui/kebab-menu";
import { formatUpdatedAt } from "../lib/formatUpdatedAt";
import type { WorkspaceItem } from "../model/types";

interface WorkspaceCardProps {
  headingLevel?: 2 | 3; // 카드가 놓인 위치의 제목 깊이. 섹션 제목 아래에 놓이면 3을 지정한다
  onRename?: () => void; // 이름 수정을 시작하는 callback. 넘긴 화면에만 카드 메뉴가 생긴다
  workspace: WorkspaceItem;
}

/*
함수 이름 : WorkspaceCard
기능 : 워크스페이스 이름과 마지막 수정 시점을 카드 형태로 표시하고, 카드를 누르면 해당 워크스페이스로 이동한다.
인자 : WorkspaceCardProps
반환값 : 워크스페이스 카드 요소

카드가 페이지 제목 바로 아래에 오는지 섹션 제목 아래에 오는지에 따라 제목 레벨이 달라져야 하므로,
화면 구조를 아는 상위에서 headingLevel을 지정한다.

링크는 카드 전체를 덮는 형제 요소로 둔다. 카드를 링크로 감싸면 케밥 메뉴 버튼을 링크 안에 넣을 수 없다.

메뉴는 onRename을 넘긴 화면에만 그린다. 편집을 연결하지 않은 화면에 동작하지 않는 메뉴를 두지 않는다.
*/
export function WorkspaceCard({
  headingLevel = 2,
  onRename,
  workspace,
}: WorkspaceCardProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const formattedUpdatedAt = formatUpdatedAt(workspace.updatedAt);

  return (
    <article className="group relative flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={routes.workspace(workspace.id)}
        aria-label={`${workspace.name} 워크스페이스 열기`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      />

      {onRename ? (
        <div className="absolute right-3 top-3 z-10">
          <KebabMenu
            ariaLabel={`${workspace.name} 워크스페이스 메뉴`}
            items={[
              {
                id: "rename",
                label: "이름 수정하기",
                onSelect: onRename,
              },
            ]}
          />
        </div>
      ) : null}

      <Heading
        className={`pointer-events-none relative text-base font-semibold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700 ${onRename ? "pr-8" : ""}`}
      >
        {workspace.name}
      </Heading>
      {formattedUpdatedAt ? (
        <p className="pointer-events-none relative text-xs text-slate-500">
          Modified {formattedUpdatedAt}
        </p>
      ) : null}
    </article>
  );
}
