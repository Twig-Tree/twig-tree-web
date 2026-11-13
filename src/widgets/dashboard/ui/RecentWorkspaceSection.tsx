"use client";

import Link from "next/link";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";
import { useDeleteWorkspace } from "@/src/features/workspace/delete-workspace";
import { EditableWorkspaceCard } from "@/src/features/workspace/update-workspace";
import { CardGridSkeleton } from "@/src/shared/ui/card-grid-skeleton";

/*
대시보드에 보여줄 최근 워크스페이스 개수. 넓은 화면 그리드 한 줄(lg:grid-cols-3)에 맞춘 값이다.
페이지는 이 값을 조회 개수로 쓰고, 자리표시자 개수도 이 값을 따른다. 그리드를 아는 여기서 정한다.
*/
export const RECENT_WORKSPACE_DISPLAY_COUNT = 3;

/*
입력창까지 스크롤 없이 보이도록 어떤 너비에서도 한 줄만 그린다. 열 수를 넘는 카드는 숨기고 전체 보기에 맡긴다.
가로 스크롤로 두지 않는다. 스크롤 영역은 세로로도 잘려 카드 그림자가 사라진다.
*/
const RECENT_WORKSPACE_GRID_CLASS_NAME =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 max-lg:[&>*:nth-child(n+3)]:hidden max-sm:[&>*:nth-child(n+2)]:hidden";

// 창 높이가 낮으면 카드도 함께 낮아진다. 최솟값은 제목과 수정 시각이 들어가는 높이다.
const RECENT_WORKSPACE_CARD_HEIGHT_CLASS_NAME =
  "min-h-[clamp(5.5rem,16vh,9rem)]";

interface RecentWorkspaceSectionProps {
  editingWorkspaceId: string | null; // 이름을 수정 중인 워크스페이스 ID
  isError: boolean; // 최신순 목록 조회에 실패했는지 여부
  isLoading: boolean; // 최신순 목록을 처음 조회하는 중인지 여부
  isLoaded: boolean; // 최신순 목록이 도착했는지 여부. 빈 상태 안내를 언제 보여줄지 정한다
  onEditingEnd: () => void; // 이름 저장 또는 취소 후 편집을 끝낼 때 부른다
  onWorkspaceEditingStart: (workspaceId: string) => void; // 카드 메뉴에서 이름 수정을 고르면 부른다
  viewAllHref: string; // 전체 목록으로 이동할 경로
  workspaces: WorkspaceItem[]; // 보여줄 워크스페이스. RECENT_WORKSPACE_DISPLAY_COUNT개까지만 조회해서 넘긴다
}

/*
함수 이름 : RecentWorkspaceSection
기능 : 최근 작업한 워크스페이스를 카드 목록으로 보여주고 전체 목록으로 가는 링크를 제공한다. 조회 중·실패·빈 목록 상태를 알린다.
인자 : RecentWorkspaceSectionProps
반환값 : 최근 워크스페이스 섹션

카드는 디렉터리 화면과 같은 WorkspaceCard를 사용한다.
다만 여기서는 섹션 제목 아래에 놓이므로 카드 제목을 h3으로 낮춘다.

카드 메뉴는 최신순 화면과 같게 이름 수정과 삭제를 둔다. 요약 영역이라도 같은 카드에서 메뉴가 사라지면
메뉴를 찾는 사용자에게 화면마다 다르게 보인다. 이동 항목은 최신순 화면에도 없으므로 두지 않는다.
편집 중인 카드는 페이지가 정하고, 이 섹션은 그 카드를 편집 카드로 바꿔 그린다.

제목과 전체 보기 링크는 상태와 무관하게 둔다. 조회에 실패해도 최신순 화면으로 이동할 길은 남긴다.
*/
export function RecentWorkspaceSection({
  editingWorkspaceId,
  isError,
  isLoaded,
  isLoading,
  onEditingEnd,
  onWorkspaceEditingStart,
  viewAllHref,
  workspaces,
}: RecentWorkspaceSectionProps) {
  const { deleteWorkspace, isDeletingWorkspace } = useDeleteWorkspace();

  const renderContents = () => {
    /*
    재조회에 실패해도 이전 목록이 남아 있지만 그리지 않는다. 옛 목록을 그리면 조회가 실패한 사실이 화면에서 사라진다.
    */
    if (isError) {
      return (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          최근 워크스페이스를 불러오지 못했습니다.
        </p>
      );
    }

    /*
    자리표시자는 표시할 최대 개수만큼 둔다. 넘치는 카드는 그리드가 숨기므로 한 줄을 넘지 않는다.
    */
    if (isLoading) {
      return (
        <div className="mt-4">
          <CardGridSkeleton
            cardCount={RECENT_WORKSPACE_DISPLAY_COUNT}
            cardHeightClassName={RECENT_WORKSPACE_CARD_HEIGHT_CLASS_NAME}
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
        <p className="mt-4 text-sm text-content-muted">
          아직 작업한 워크스페이스가 없습니다.
        </p>
      );
    }

    return (
      <ul className={`mt-4 ${RECENT_WORKSPACE_GRID_CLASS_NAME}`}>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            {workspace.id === editingWorkspaceId ? (
              <EditableWorkspaceCard
                workspace={workspace}
                heightClassName={RECENT_WORKSPACE_CARD_HEIGHT_CLASS_NAME}
                onEditingEnd={onEditingEnd}
              />
            ) : (
              <WorkspaceCard
                workspace={workspace}
                headingLevel={3}
                heightClassName={RECENT_WORKSPACE_CARD_HEIGHT_CLASS_NAME}
                isDeleteDisabled={isDeletingWorkspace}
                onDelete={() => void deleteWorkspace(workspace)}
                onRename={() => onWorkspaceEditingStart(workspace.id)}
              />
            )}
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
          className="text-xs font-semibold tracking-wider text-content-muted uppercase"
        >
          최근 워크스페이스
        </h2>

        <Link
          href={viewAllHref}
          className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
        >
          전체 보기
        </Link>
      </div>

      {renderContents()}
    </section>
  );
}
