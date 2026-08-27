"use client";

import { ChevronRight, CornerUpLeft, FolderOpen, X } from "lucide-react";
import { useGetFolderListQuery, type FolderItem } from "@/src/entities/folder";
import { Breadcrumb } from "@/src/shared/ui/breadcrumb";
import { Button } from "@/src/shared/ui/button";
import { Modal } from "@/src/shared/ui/modal";
import { useFolderPath } from "../model/useFolderPath";

const MODAL_TITLE = "워크스페이스를 만들 위치";
const SKELETON_WIDTH_CLASS_NAMES = ["w-3/5", "w-2/5", "w-2/3"];

interface FolderPathPickerModalProps {
  isOpen: boolean; // 팝업 표시 여부
  onClose: () => void; // 닫기를 요청했을 때 실행할 callback
  onSelect: (folderParentId: string | null) => void; // 위치를 확정했을 때 선택한 폴더 ID를 받는 callback. 루트는 null
}

/*
함수 이름 : FolderPathPickerModal
기능 : 루트부터 폴더를 따라 내려가며 워크스페이스를 만들 위치를 고르는 팝업을 표시한다.
인자 : FolderPathPickerModalProps
반환값 : 폴더 경로 선택 팝업

내용을 별도 컴포넌트로 분리해 팝업이 열려 있는 동안에만 경로 상태와 폴더 목록 query가 살아 있게 한다.
Modal이 닫힌 상태에서는 children을 렌더링하지 않으므로, 다시 열면 경로가 루트부터 시작한다.
*/
export function FolderPathPickerModal({
  isOpen,
  onClose,
  onSelect,
}: FolderPathPickerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={MODAL_TITLE}>
      <FolderPathPickerContent onClose={onClose} onSelect={onSelect} />
    </Modal>
  );
}

type FolderPathPickerContentProps = Omit<FolderPathPickerModalProps, "isOpen">;

/*
함수 이름 : FolderPathPickerContent
기능 : 현재 경로의 하위 폴더 목록을 조회해 표시하고, 경로 이동과 위치 확정을 처리한다.
인자 : FolderPathPickerContentProps
반환값 : 팝업 내부의 경로 표시, 폴더 목록, 확정 버튼 영역
*/
function FolderPathPickerContent({
  onClose,
  onSelect,
}: FolderPathPickerContentProps) {
  const {
    breadcrumbItems,
    currentFolderId,
    currentPathLabel,
    handleEnterFolder,
    handleGoToParentFolder,
    hasParentFolder,
  } = useFolderPath();

  const folderListQuery = useGetFolderListQuery(currentFolderId);

  /*
  스켈레톤은 isFetching이 아니라 isPending에 건다. 이미 받아 둔 목록이 있는 폴더로
  되돌아가면 배경 refetch가 일어날 수 있는데, 그때 목록 위에 스켈레톤이 깜빡이지 않게 한다.
  */
  const isFolderListPending = folderListQuery.isPending;
  const folders = folderListQuery.data ?? [];

  /*
  현재 폴더의 목록을 확인하지 못한 상태에서는 그 폴더를 위치로 확정하지 않는다.
  목록이 비어 있는 것은 조회에 성공한 결과이므로 확정을 막지 않는다.
  */
  const isSelectDisabled = isFolderListPending || folderListQuery.isError;

  const handleSelectCurrentFolder = () => {
    if (isSelectDisabled) return;

    onSelect(currentFolderId);
    onClose();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {MODAL_TITLE}
          </h2>
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 pb-4">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="max-h-56 overflow-y-auto">
            {hasParentFolder ? (
              <button
                type="button"
                onClick={handleGoToParentFolder}
                className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
                  aria-hidden="true"
                >
                  <CornerUpLeft className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-500">
                  상위 폴더로
                </span>
              </button>
            ) : null}

            {isFolderListPending ? (
              <FolderListSkeleton />
            ) : folderListQuery.isError ? (
              <div className="px-4 py-7 text-center">
                <p role="alert" className="text-sm font-medium text-red-600">
                  폴더 목록을 불러오지 못했습니다.
                </p>
                <Button
                  className="mt-3.5"
                  onClick={() => void folderListQuery.refetch()}
                >
                  다시 시도
                </Button>
              </div>
            ) : folders.length === 0 ? (
              <EmptyFolderNotice />
            ) : (
              folders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  onEnter={() => handleEnterFolder(folder)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
        <p className="min-w-0 truncate text-sm text-slate-500">
          <span className="text-slate-400">여기에 만듭니다 · </span>
          <span className="font-semibold text-slate-700">
            {currentPathLabel}
          </span>
        </p>
        <div className="flex shrink-0 gap-3">
          <Button onClick={onClose}>취소</Button>
          <Button
            variant="primary"
            onClick={handleSelectCurrentFolder}
            disabled={isSelectDisabled}
          >
            여기에 만들기
          </Button>
        </div>
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
      className="group flex w-full items-center gap-3 border-b border-slate-100 px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50"
        aria-hidden="true"
      >
        <span className="relative block h-2.5 w-3.5 rounded-[3px] bg-indigo-600 before:absolute before:-top-1 before:left-0 before:h-1 before:w-2 before:rounded-t-[2px] before:bg-indigo-600" />
      </span>
      <span className="flex-1 truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-700">
        {folder.name}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-400"
        aria-hidden="true"
      />
    </button>
  );
}

/*
함수 이름 : FolderListSkeleton
기능 : 폴더 목록을 조회하는 동안 목록 영역의 높이를 유지하는 자리표시자를 표시한다.
인자 : 없음
반환값 : 스켈레톤 행 목록
*/
function FolderListSkeleton() {
  return (
    <div aria-hidden="true">
      {SKELETON_WIDTH_CLASS_NAMES.map((widthClassName) => (
        <div
          key={widthClassName}
          className="flex items-center gap-3 border-b border-slate-100 px-3.5 py-2.5 last:border-b-0"
        >
          <span className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-slate-100" />
          <span
            className={`h-3 animate-pulse rounded-full bg-slate-200 ${widthClassName}`}
          />
        </div>
      ))}
    </div>
  );
}

/*
함수 이름 : EmptyFolderNotice
기능 : 하위 폴더가 없는 위치에서 이 위치를 그대로 고를 수 있음을 알린다.
인자 : 없음
반환값 : 빈 폴더 안내 영역
*/
function EmptyFolderNotice() {
  return (
    <div className="px-4 py-7 text-center">
      <span
        className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-indigo-50 text-indigo-400"
        aria-hidden="true"
      >
        <FolderOpen className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-slate-700">하위 폴더가 없습니다</p>
      <p className="mt-1 text-sm text-slate-400">여기에 만들 수 있습니다</p>
    </div>
  );
}
