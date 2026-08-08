import Link from "next/link";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";

interface RecentWorkspaceSectionProps {
  viewAllHref: string; // 전체 목록으로 이동할 경로
  workspaces: WorkspaceItem[];
}

/*
함수 이름 : RecentWorkspaceSection
기능 : 최근 작업한 워크스페이스를 카드 목록으로 보여주고 전체 목록으로 가는 링크를 제공한다.
인자 : RecentWorkspaceSectionProps
반환값 : 최근 워크스페이스 섹션

카드는 디렉터리 화면과 같은 WorkspaceCard를 사용한다.
다만 여기서는 섹션 제목 아래에 놓이므로 카드 제목을 h3으로 낮춘다.
*/
export function RecentWorkspaceSection({
  viewAllHref,
  workspaces,
}: RecentWorkspaceSectionProps) {
  return (
    <section aria-labelledby="recent-workspaces-heading">
      <div className="flex items-center justify-between">
        <h2
          id="recent-workspaces-heading"
          className="text-xs font-semibold tracking-wider text-slate-500 uppercase"
        >
          Recent Workspaces
        </h2>

        <Link
          href={viewAllHref}
          className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          View All
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          아직 작업한 워크스페이스가 없습니다.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <WorkspaceCard workspace={workspace} headingLevel={3} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
