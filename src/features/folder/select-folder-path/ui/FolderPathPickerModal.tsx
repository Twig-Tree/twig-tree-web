"use client";

import {
  Archive,
  ChevronRight,
  CornerUpLeft,
  Folder,
  FolderOpen,
  X,
} from "lucide-react";
import { useState } from "react";
import { useGetFolderListQuery, type FolderItem } from "@/src/entities/folder";
import {
  useGetWorkspaceListQuery,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { useIsMounted } from "@/src/shared/lib/react/useIsMounted";
import { Breadcrumb } from "@/src/shared/ui/breadcrumb";
import { Button } from "@/src/shared/ui/button";
import { Modal } from "@/src/shared/ui/modal";
import { useFolderPath } from "../model/useFolderPath";

const SKELETON_WIDTH_CLASS_NAMES = ["w-3/5", "w-2/5", "w-2/3"];

/*
목록 영역의 높이를 고정한다. 항목 개수와 로딩·에러·빈 폴더 상태에 따라 높이가 달라지면
경로를 옮길 때마다 팝업 크기가 흔들린다. 높이를 넘는 목록은 이 영역 안에서 스크롤한다.
*/
const CONTENTS_LIST_CLASS_NAME =
  "flex h-56 flex-col overflow-hidden rounded-control border border-line-subtle";

// 목록 대신 안내 문구를 보여주는 상태는 고정된 높이 안에서 가운데 정렬한다.
const LIST_NOTICE_CLASS_NAME =
  "flex h-full flex-col items-center justify-center px-4 text-center";

interface FolderPathPickerModalProps {
  isOpen: boolean; // 팝업 표시 여부
  onClose: () => void; // 닫기를 요청했을 때 실행할 callback
  /*
  위치를 확정했을 때 선택한 폴더 ID(루트는 null)를 받는 callback.
  Promise를 돌려주면 끝날 때까지 기다렸다가 true일 때만 팝업을 닫는다. 실패하면 열어 둔 채 errorMessage를 보여준다.
  */
  onSelect: (folderParentId: string | null) => void | Promise<boolean>;
  title: string; // 팝업 제목. 무엇을 위한 위치인지 적는다
  confirmLabel: string; // 위치를 확정하는 버튼 문구
  /*
  옮기려는 대상이 지금 들어 있는 폴더 ID. 루트는 null이고, 생략하면 막지 않는다.
  이 위치에서는 확정 버튼을 비활성화한다. 같은 곳으로 옮기는 것은 이동이 아니다.
  */
  currentLocationId?: string | null;
  /*
  옮기려는 폴더 ID. 생략하면 막지 않는다.
  이 폴더 행은 들어갈 수 없게 그려, 자기 자신과 그 하위 폴더를 고를 수 없게 한다.
  */
  movingFolderId?: string;
  isSelectPending?: boolean; // 확정 요청을 기다리는 중이면 true. 확정 버튼을 비활성화한다
  errorMessage?: string | null; // 마지막 확정이 실패한 이유. 실패한 위치에 있는 동안만 보여준다
}

/*
함수 이름 : FolderPathPickerModal
기능 : 루트부터 폴더를 따라 내려가며 위치 하나를 고르는 팝업을 표시한다. 워크스페이스를 만들 위치와 폴더·워크스페이스를 옮길 위치에 쓴다.
인자 : FolderPathPickerModalProps
반환값 : 폴더 경로 선택 팝업

내용을 별도 컴포넌트로 분리해 팝업이 열려 있는 동안에만 경로 상태와 목록 query가 살아 있게 한다.
Modal이 닫힌 상태에서는 children을 렌더링하지 않으므로, 다시 열면 경로가 루트부터 시작한다.
*/
export function FolderPathPickerModal({
  isOpen,
  ...contentProps
}: FolderPathPickerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={contentProps.onClose}
      title={contentProps.title}
    >
      <FolderPathPickerContent {...contentProps} />
    </Modal>
  );
}

type FolderPathPickerContentProps = Omit<FolderPathPickerModalProps, "isOpen">;

/*
함수 이름 : FolderPathPickerContent
기능 : 현재 경로에 든 하위 폴더와 워크스페이스를 조회해 표시하고, 경로 이동과 위치 확정을 처리한다.
인자 : FolderPathPickerContentProps
반환값 : 팝업 내부의 경로 표시, 폴더·워크스페이스 목록, 확정 버튼 영역
*/
function FolderPathPickerContent({
  onClose,
  onSelect,
  title,
  confirmLabel,
  currentLocationId,
  movingFolderId,
  isSelectPending = false,
  errorMessage = null,
}: FolderPathPickerContentProps) {
  const isMounted = useIsMounted();
  const {
    breadcrumbItems,
    currentFolderId,
    handleEnterFolder,
    handleGoToParentFolder,
    hasParentFolder,
  } = useFolderPath();

  const folderListQuery = useGetFolderListQuery(currentFolderId);
  const workspaceListQuery = useGetWorkspaceListQuery(currentFolderId);

  /*
  스켈레톤은 isFetching이 아니라 isPending에 건다. 이미 받아 둔 목록이 있는 폴더로
  되돌아가면 배경 refetch가 일어날 수 있는데, 그때 목록 위에 스켈레톤이 깜빡이지 않게 한다.
  */
  const isListPending =
    folderListQuery.isPending || workspaceListQuery.isPending;

  /*
  한쪽만 실패해도 목록을 그리지 않는다. 성공한 쪽만 그리면 실패한 쪽이 "없음"으로 읽혀,
  이 폴더에 무엇이 들어 있는지 확인하러 연 팝업이 잘못된 답을 준다.
  DirectoryContentsGrid도 같은 이유로 두 목록을 함께 판정한다.
  */
  const isListError = folderListQuery.isError || workspaceListQuery.isError;

  const folders = folderListQuery.data ?? [];
  const workspaces = workspaceListQuery.data ?? [];

  /*
  확정한 결과를 기다리는 동안에는 다른 폴더로 옮겨 가지 못하게 한다. 옮겨 간 뒤 실패하면
  실패한 위치와 보고 있는 위치가 달라 안내를 보여줄 곳이 없다.
  onSelect가 끝날 때까지와 부모가 알려 준 요청 상태를 함께 본다. 부모의 상태는 다음 렌더에야 바뀐다.
  */
  const [isAwaitingSelect, setIsAwaitingSelect] = useState(false);
  const isNavigationLocked = isAwaitingSelect || isSelectPending;

  /*
  현재 폴더의 목록을 확인하지 못한 상태에서는 그 폴더를 위치로 확정하지 않는다.
  목록이 비어 있는 것은 조회에 성공한 결과이므로 확정을 막지 않는다.
  */
  const isCurrentLocation = currentFolderId === currentLocationId; // 생략한 undefined는 어떤 위치와도 같지 않다.
  const isSelectDisabled =
    isListPending ||
    isListError ||
    isCurrentLocation ||
    isSelectPending ||
    isAwaitingSelect;

  /*
  실패 문구는 실패한 위치에서만 보여준다. 다른 폴더로 옮겨 가서도 남아 있으면,
  "같은 이름이 있다"는 안내가 지금 보고 있는 폴더에 대한 말로 읽힌다.
  */
  const [failedFolderId, setFailedFolderId] = useState<
    string | null | undefined
  >(undefined);
  const visibleErrorMessage =
    failedFolderId === currentFolderId ? errorMessage : null;

  const handleRetry = () => {
    void folderListQuery.refetch();
    void workspaceListQuery.refetch();
  };

  const handleSelectCurrentFolder = async () => {
    if (isSelectDisabled) return;

    const selectedFolderId = currentFolderId;
    setIsAwaitingSelect(true);
    const result = await onSelect(selectedFolderId);

    /*
    기다리는 동안 사용자가 팝업을 닫았으면 이미 사라진 팝업이므로 아무것도 하지 않는다.
    */
    if (!isMounted()) return;

    setIsAwaitingSelect(false);

    if (result === false) {
      setFailedFolderId(selectedFolderId);
      return;
    }

    onClose();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div className="min-w-0" inert={isNavigationLocked}>
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="mt-2 text-xl font-bold tracking-tight text-content">
            {title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-content-muted transition-colors hover:bg-surface-hover hover:text-content-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 pb-4" inert={isNavigationLocked}>
        <div className={CONTENTS_LIST_CLASS_NAME}>
          {hasParentFolder ? (
            <button
              type="button"
              onClick={handleGoToParentFolder}
              className="flex w-full shrink-0 items-center gap-3 border-b border-line-subtle bg-surface-muted px-3.5 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-hover text-content-muted"
                aria-hidden="true"
              >
                <CornerUpLeft className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-content-muted">
                상위 폴더로
              </span>
            </button>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {isListPending ? (
              <ContentsListSkeleton />
            ) : isListError ? (
              <div className={LIST_NOTICE_CLASS_NAME}>
                <p role="alert" className="text-sm font-medium text-danger">
                  목록을 불러오지 못했습니다.
                </p>
                <Button className="mt-3.5" onClick={handleRetry}>
                  다시 시도
                </Button>
              </div>
            ) : folders.length === 0 && workspaces.length === 0 ? (
              <EmptyContentsNotice />
            ) : (
              <>
                {folders.map((folder) =>
                  folder.id === movingFolderId ? (
                    <MovingFolderRow key={folder.id} folder={folder} />
                  ) : (
                    <FolderRow
                      key={folder.id}
                      folder={folder}
                      onEnter={() => handleEnterFolder(folder)}
                    />
                  ),
                )}
                {workspaces.map((workspace) => (
                  <WorkspaceRow key={workspace.id} workspace={workspace} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {visibleErrorMessage ? (
        <p
          role="alert"
          className="mx-5 mb-4 rounded-control bg-danger-subtle px-3.5 py-2.5 text-sm font-medium text-danger"
        >
          {visibleErrorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-line-subtle bg-surface-muted px-5 py-3.5">
        {isCurrentLocation ? (
          <p className="mr-auto text-sm text-content-muted">
            지금 있는 위치입니다
          </p>
        ) : null}
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="primary"
          onClick={() => void handleSelectCurrentFolder()}
          disabled={isSelectDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

interface FolderRowProps {
  folder: FolderItem; // 목록에 표시할 폴더
  onEnter: () => void; // 폴더를 눌러 한 단계 내려갈 때 실행할 callback
}

/*
함수 이름 : FolderRow
기능 : 폴더 하나를 목록 행으로 표시하고, 누르면 그 폴더로 들어가게 한다.
인자 : FolderRowProps
반환값 : 폴더 목록의 한 행
*/
function FolderRow({ folder, onEnter }: FolderRowProps) {
  return (
    <button
      type="button"
      onClick={onEnter}
      className="group flex w-full items-center gap-3 border-b border-line-subtle px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"
        aria-hidden="true"
      >
        <Folder className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate text-sm font-semibold text-content transition-colors group-hover:text-accent-hover">
        {folder.name}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-content-disabled transition-colors group-hover:text-accent"
        aria-hidden="true"
      />
    </button>
  );
}

interface MovingFolderRowProps {
  folder: FolderItem; // 옮기려는 폴더
}

/*
함수 이름 : MovingFolderRow
기능 : 옮기려는 폴더 자신을 들어갈 수 없는 행으로 표시한다.
인자 : MovingFolderRowProps
반환값 : 폴더 목록의 한 행

목록에서 빼지 않는다. 빠지면 같은 위치에 있어야 할 폴더가 사라진 것처럼 보인다.
들어갈 수 없으면 그 하위 폴더도 고를 수 없으므로, 자기 하위로 옮기는 경로가 화면에서 막힌다.
*/
function MovingFolderRow({ folder }: MovingFolderRowProps) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-line-subtle px-3.5 py-2.5 last:border-b-0">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-hover text-content-muted"
        aria-hidden="true"
      >
        <Folder className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate text-sm font-medium text-content-muted">
        {folder.name}
      </span>
      <span className="shrink-0 text-xs text-content-muted">옮기는 폴더</span>
    </div>
  );
}

interface WorkspaceRowProps {
  workspace: WorkspaceItem; // 목록에 표시할 워크스페이스
}

/*
함수 이름 : WorkspaceRow
기능 : 이 폴더에 든 워크스페이스 하나를 목록 행으로 표시한다.
인자 : WorkspaceRowProps
반환값 : 워크스페이스 목록의 한 행

폴더와 달리 눌러서 들어갈 곳이 없으므로 button이 아니라 div로 그린다.
호버 효과와 화살표를 빼고 색을 낮춰, 이동할 수 있는 폴더 행과 구분되게 한다.
*/
function WorkspaceRow({ workspace }: WorkspaceRowProps) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-line-subtle px-3.5 py-2.5 last:border-b-0">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-hover text-content-muted"
        aria-hidden="true"
      >
        <Archive className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate text-sm font-medium text-content-muted">
        {workspace.name}
      </span>
    </div>
  );
}

/*
함수 이름 : ContentsListSkeleton
기능 : 목록을 조회하는 동안 목록 영역의 높이를 유지하는 자리표시자를 표시한다.
인자 : 없음
반환값 : 스켈레톤 행 목록
*/
function ContentsListSkeleton() {
  return (
    <div aria-hidden="true">
      {SKELETON_WIDTH_CLASS_NAMES.map((widthClassName) => (
        <div
          key={widthClassName}
          className="flex items-center gap-3 border-b border-line-subtle px-3.5 py-2.5 last:border-b-0"
        >
          <span className="h-7 w-7 shrink-0 animate-pulse rounded-control bg-surface-hover" />
          <span
            className={`h-3 animate-pulse rounded-full bg-surface-strong ${widthClassName}`}
          />
        </div>
      ))}
    </div>
  );
}

/*
함수 이름 : EmptyContentsNotice
기능 : 폴더도 워크스페이스도 없는 위치임을 알린다.
인자 : 없음
반환값 : 빈 폴더 안내 영역
*/
function EmptyContentsNotice() {
  return (
    <div className={LIST_NOTICE_CLASS_NAME}>
      <span
        className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-control bg-accent-subtle text-accent"
        aria-hidden="true"
      >
        <FolderOpen className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-content-secondary">
        하위 폴더와 워크스페이스가 없습니다
      </p>
      <p className="mt-1 text-sm text-content-muted">
        이 위치를 그대로 고를 수 있습니다
      </p>
    </div>
  );
}
