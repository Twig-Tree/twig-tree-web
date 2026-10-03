"use client";

import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";
import { useDeleteWorkspace } from "@/src/features/workspace/delete-workspace";
import { EditableWorkspaceCard } from "@/src/features/workspace/update-workspace";
import { CardGridSkeleton } from "@/src/shared/ui/card-grid-skeleton";

interface RecentWorkspaceGridProps {
  editingWorkspaceId: string | null; // 이름을 수정 중인 워크스페이스 ID
  isError: boolean; // 최신순 목록 조회에 실패했는지 여부
  isLoading: boolean; // 최신순 목록을 처음 조회하는 중인지 여부
  isLoaded: boolean; // 최신순 목록이 도착했는지 여부. 빈 상태 안내를 언제 보여줄지 정한다
  onEditingEnd: () => void; // 이름 저장 또는 취소 후 편집을 끝낼 때 부른다
  onWorkspaceEditingStart: (workspaceId: string) => void;
  workspaces: WorkspaceItem[];
}

/*
함수 이름 : RecentWorkspaceGrid
기능 : 폴더와 무관하게 최근 수정한 순서로 워크스페이스 카드를 그리고, 조회 중·실패·빈 목록 상태를 알린다.
인자 : RecentWorkspaceGridProps
반환값 : 최신순 워크스페이스 목록 영역

폴더를 가로지르는 목록이라 삭제와 이름 수정은 항목의 folderId로 갱신할 폴더 목록을 찾는다.
편집 카드는 그 폴더의 형제 목록을 직접 조회해 이름 중복을 검사한다.
*/
export function RecentWorkspaceGrid({
  editingWorkspaceId,
  isError,
  isLoaded,
  isLoading,
  onEditingEnd,
  onWorkspaceEditingStart,
  workspaces,
}: RecentWorkspaceGridProps) {
  const { deleteWorkspace, isDeletingWorkspace } = useDeleteWorkspace();

  /*
  재조회에 실패해도 이전 목록이 남아 있지만 그리지 않는다. 옛 목록을 그리면 조회가 실패한 사실이 화면에서 사라진다.
  */
  if (isError) {
    return (
      <section aria-label="Recent workspaces">
        <p role="alert" className="text-sm font-medium text-red-600">
          목록을 불러오지 못했습니다.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return <CardGridSkeleton ariaLabel="Recent workspaces" />;
  }

  /*
  목록이 도착한 뒤에만 빈 상태를 알린다. 네트워크가 끊겨 조회가 멈춘 동안에는
  조회 중도 오류도 아니지만 비어 있다고 확인된 것이 아니다.
  */
  if (isLoaded && workspaces.length === 0) {
    return (
      <section aria-label="Recent workspaces">
        <p className="text-sm text-slate-500">아직 워크스페이스가 없습니다.</p>
      </section>
    );
  }

  return (
    <section
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-label="Recent workspaces"
    >
      {workspaces.map((workspace) =>
        workspace.id === editingWorkspaceId ? (
          <EditableWorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onEditingEnd={onEditingEnd}
          />
        ) : (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            isDeleteDisabled={isDeletingWorkspace}
            onDelete={() => void deleteWorkspace(workspace)}
            onRename={() => onWorkspaceEditingStart(workspace.id)}
          />
        ),
      )}
    </section>
  );
}
