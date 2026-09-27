import Link from "next/link";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";
import { CardGridSkeleton } from "@/src/shared/ui/card-grid-skeleton";

/*
대시보드에 보여줄 최근 워크스페이스 개수. 넓은 화면 그리드 한 줄(lg:grid-cols-3)에 맞춘 값이다.
목록을 자르는 것은 페이지지만, 자리표시자 개수도 이 값을 따라야 해서 그리드를 아는 여기서 정한다.
*/
export const RECENT_WORKSPACE_DISPLAY_COUNT = 3;

const RECENT_WORKSPACE_GRID_CLASS_NAME =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

interface RecentWorkspaceSectionProps {
  isError: boolean; // 최신순 목록 조회에 실패했는지 여부
  isLoading: boolean; // 최신순 목록을 처음 조회하는 중인지 여부
  isLoaded: boolean; // 최신순 목록이 도착했는지 여부. 빈 상태 안내를 언제 보여줄지 정한다
  viewAllHref: string; // 전체 목록으로 이동할 경로
  workspaces: WorkspaceItem[]; // 보여줄 워크스페이스. RECENT_WORKSPACE_DISPLAY_COUNT개까지 잘라서 넘긴다
}

/*
함수 이름 : RecentWorkspaceSection
기능 : 최근 작업한 워크스페이스를 카드 목록으로 보여주고 전체 목록으로 가는 링크를 제공한다. 조회 중·실패·빈 목록 상태를 알린다.
인자 : RecentWorkspaceSectionProps
반환값 : 최근 워크스페이스 섹션

카드는 디렉터리 화면과 같은 WorkspaceCard를 사용한다.
다만 여기서는 섹션 제목 아래에 놓이므로 카드 제목을 h3으로 낮춘다.

제목과 전체 보기 링크는 상태와 무관하게 둔다. 조회에 실패해도 최신순 화면으로 이동할 길은 남긴다.
*/
export function RecentWorkspaceSection({
  isError,
  isLoaded,
  isLoading,
  viewAllHref,
  workspaces,
}: RecentWorkspaceSectionProps) {
  const renderContents = () => {
    /*
    재조회에 실패해도 이전 목록이 남아 있지만 그리지 않는다. 옛 목록을 그리면 조회가 실패한 사실이 화면에서 사라진다.
    */
    if (isError) {
      return (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          최근 워크스페이스를 불러오지 못했습니다.
        </p>
      );
    }

    /*
    자리표시자는 표시할 최대 개수만큼 둔다. 실제로 더 적게 오면 좁은 화면에서 아래 입력창이 올라오지만,
    대부분은 최대 개수를 채우므로 그쪽에 맞춘다.
    */
    if (isLoading) {
      return (
        <div className="mt-4">
          <CardGridSkeleton
            cardCount={RECENT_WORKSPACE_DISPLAY_COUNT}
            gridClassName={RECENT_WORKSPACE_GRID_CLASS_NAME}
          />
        </div>
      );
    }

    /*
    목록이 도착한 뒤에만 빈 상태를 알린다. 네트워크가 끊겨 조회가 멈춘 동안에는
    조회 중도 오류도 아니지만 비어 있다고 확인된 것이 아니다.
    */
    if (isLoaded && workspaces.length === 0) {
      return (
        <p className="mt-4 text-sm text-slate-400">
          아직 작업한 워크스페이스가 없습니다.
        </p>
      );
    }

    return (
      <ul className={`mt-4 ${RECENT_WORKSPACE_GRID_CLASS_NAME}`}>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <WorkspaceCard workspace={workspace} headingLevel={3} />
          </li>
        ))}
      </ul>
    );
  };

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

      {renderContents()}
    </section>
  );
}
