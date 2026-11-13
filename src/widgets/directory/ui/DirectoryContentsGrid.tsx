"use client";

import { FolderCard, type FolderItem } from "@/src/entities/folder";
import { useDeleteFolder } from "@/src/features/folder/delete-folder";
import { useMoveFolder } from "@/src/features/folder/move-folder";
import { FolderPathPickerModal } from "@/src/features/folder/select-folder-path";
import { EditableFolderCard } from "@/src/features/folder/update-folder";
import { WorkspaceCard, type WorkspaceItem } from "@/src/entities/workspace";
import { useDeleteWorkspace } from "@/src/features/workspace/delete-workspace";
import { useMoveWorkspace } from "@/src/features/workspace/move-workspace";
import { EditableWorkspaceCard } from "@/src/features/workspace/update-workspace";
import { CardGridSkeleton } from "@/src/shared/ui/card-grid-skeleton";
import { DraggableDirectoryItem } from "./DraggableDirectoryItem";

interface DirectoryContentsGridProps {
  editingFolderId: string | null;
  editingWorkspaceId: string | null; // 이름을 수정 중인 워크스페이스 ID. 폴더 ID와 값이 겹칠 수 있어 따로 받는다
  folderParentId: string | null;
  folders: FolderItem[];
  isError: boolean; // 폴더와 워크스페이스 목록 중 하나라도 조회에 실패했는지 여부
  isLoading: boolean; // 두 목록 중 하나라도 조회 중인지 여부
  isLoaded: boolean; // 두 목록이 모두 도착했는지 여부. 빈 상태 안내를 언제 보여줄지 정한다
  onFolderEditingStart: (folderId: string) => void;
  onEditingEnd: () => void; // 폴더와 워크스페이스 편집 모두 끝낼 때 부른다
  onWorkspaceEditingStart: (workspaceId: string) => void;
  workspaces: WorkspaceItem[];
}

export function DirectoryContentsGrid({
  editingFolderId,
  editingWorkspaceId,
  folderParentId,
  folders,
  isError,
  isLoaded,
  isLoading,
  onFolderEditingStart: onEditingStart,
  onEditingEnd,
  onWorkspaceEditingStart,
  workspaces,
}: DirectoryContentsGridProps) {
  const { deleteFolder, isDeletingFolder } = useDeleteFolder({
    folderParentId,
  });
  const { deleteWorkspace, isDeletingWorkspace } = useDeleteWorkspace();

  /*
  이동 feature는 위치 선택 팝업을 import하지 않는다. 둘 다 feature라 서로 import하면 같은 계층끼리 의존하게 되므로,
  두 feature를 아는 이 widget이 hook의 상태를 팝업에 잇는다.
  */
  const {
    movingFolder,
    openMoveFolder,
    closeMoveFolder,
    moveFolder,
    isMovingFolder,
    moveFolderErrorMessage,
  } = useMoveFolder({ folderParentId });
  const {
    movingWorkspace,
    openMoveWorkspace,
    closeMoveWorkspace,
    moveWorkspace,
    isMovingWorkspace,
    moveWorkspaceErrorMessage,
  } = useMoveWorkspace();

  /*
  한쪽만 실패해도 아무것도 그리지 않는다. 성공한 쪽만 그리면 실패한 쪽이
  "비어 있음"으로 읽혀, 조회가 실패한 사실이 화면에서 사라진다.
  */
  if (isError) {
    return (
      <section aria-label="폴더 내용">
        <p role="alert" className="text-sm font-medium text-danger">
          목록을 불러오지 못했습니다.
        </p>
      </section>
    );
  }

  /*
  조회 중임을 자리표시자로 알린다. 아무것도 그리지 않으면 빈 폴더와 구분되지 않는다.

  isLoaded의 반대가 아니라 isLoading을 따로 받는다. query가 비활성이면 둘 다 false여서,
  isLoaded만 보면 조회를 시작하지도 않은 화면에 자리표시자가 계속 남는다.
  */
  if (isLoading) {
    return <CardGridSkeleton ariaLabel="폴더 내용" />;
  }

  /*
  목록이 도착한 뒤에만 빈 상태를 알린다. 아직 조회 중이거나 query가 비활성이면
  둘 다 빈 배열이지만 비어 있다고 확인된 것이 아니다.

  두 목록이 모두 비었을 때만 해당한다. 그리드가 폴더와 워크스페이스를 함께 그리므로
  한쪽만 비어 있는 것은 빈 화면이 아니다.
  */
  if (isLoaded && folders.length === 0 && workspaces.length === 0) {
    return (
      <section aria-label="폴더 내용">
        <p className="text-sm text-content-muted">
          아직 폴더나 워크스페이스가 없습니다.
        </p>
        <p className="mt-1 text-sm text-content-muted">
          위의 새 폴더나 새 워크스페이스 버튼으로 만들 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        aria-label="폴더 내용"
      >
        {folders.map((folder) =>
          folder.id === editingFolderId ? (
            <EditableFolderCard
              key={folder.id}
              folder={folder}
              folders={folders}
              folderParentId={folderParentId}
              onEditingEnd={onEditingEnd}
            />
          ) : (
            <DraggableDirectoryItem
              key={folder.id}
              item={{ kind: "folder", folder }}
            >
              <FolderCard
                folder={folder}
                isDeleteDisabled={isDeletingFolder}
                onDelete={() => {
                  void deleteFolder({
                    folderId: folder.id,
                    name: folder.name,
                  });
                }}
                onMove={() => openMoveFolder(folder)}
                onRename={() => onEditingStart(folder.id)}
              />
            </DraggableDirectoryItem>
          ),
        )}
        {workspaces.map((workspace) =>
          workspace.id === editingWorkspaceId ? (
            <EditableWorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onEditingEnd={onEditingEnd}
            />
          ) : (
            <DraggableDirectoryItem
              key={workspace.id}
              item={{ kind: "workspace", workspace }}
            >
              <WorkspaceCard
                workspace={workspace}
                isDeleteDisabled={isDeletingWorkspace}
                onDelete={() => {
                  void deleteWorkspace(workspace);
                }}
                onMove={() => openMoveWorkspace(workspace)}
                onRename={() => onWorkspaceEditingStart(workspace.id)}
              />
            </DraggableDirectoryItem>
          ),
        )}
      </section>

      <FolderPathPickerModal
        isOpen={movingFolder !== null}
        onClose={closeMoveFolder}
        onSelect={moveFolder}
        title={`"${movingFolder?.name ?? ""}" 폴더를 옮길 위치`}
        confirmLabel="여기로 옮기기"
        currentLocationId={folderParentId}
        movingFolderId={movingFolder?.id}
        isSelectPending={isMovingFolder}
        errorMessage={moveFolderErrorMessage}
      />
      <FolderPathPickerModal
        isOpen={movingWorkspace !== null}
        onClose={closeMoveWorkspace}
        onSelect={moveWorkspace}
        title={`"${movingWorkspace?.name ?? ""}" 워크스페이스를 옮길 위치`}
        confirmLabel="여기로 옮기기"
        currentLocationId={movingWorkspace?.folderId}
        isSelectPending={isMovingWorkspace}
        errorMessage={moveWorkspaceErrorMessage}
      />
    </>
  );
}
