import { NewFolderButton } from "@/src/features/folder/create-folder";
import { NewWorkspaceButton } from "@/src/features/workspace/create-workspace";
import { Breadcrumb, type BreadcrumbItem } from "@/src/shared/ui/breadcrumb";
import { DroppableBreadcrumbItem } from "./DroppableBreadcrumbItem";

/*
디렉토리 경로 항목. 카드를 끌어 놓을 수 있도록 항목이 가리키는 폴더를 함께 싣는다.
*/
export type DirectoryBreadcrumbItem = BreadcrumbItem & {
  folderId: string | null; // 이 항목이 가리키는 폴더 ID. 루트("내 폴더")는 null
};

export interface DirectoryHeaderProps {
  title: string;
  breadcrumbs: DirectoryBreadcrumbItem[]; // 비어 있으면 경로를 그리지 않는다. 루트는 제목이 곧 현재 위치다
  isTitleLoading?: boolean; // 제목을 처음 불러오는 중이라 자리표시자를 보여줄지 여부
  isPathError?: boolean; // 상위 경로를 불러오지 못해 제목과 breadcrumb을 믿을 수 없는 상태인지 여부
  onCreateFolder: () => void;
  isCreateFolderDisabled: boolean;
  onCreateWorkspace: () => void;
  isCreateWorkspaceDisabled: boolean;
}

export function DirectoryHeader({
  title,
  breadcrumbs,
  isTitleLoading = false,
  isPathError = false,
  onCreateFolder,
  isCreateFolderDisabled,
  onCreateWorkspace,
  isCreateWorkspaceDisabled,
}: DirectoryHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs.length > 0 ? (
          <div className="mb-2">
            <Breadcrumb
              items={breadcrumbs}
              renderItem={(item, content) => (
                <DroppableBreadcrumbItem folderId={item.folderId}>
                  {content}
                </DroppableBreadcrumbItem>
              )}
            />
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-content">
          {isTitleLoading ? (
            <>
              <span className="sr-only">폴더 이름을 불러오는 중입니다.</span>
              {/*
              자리표시자의 높이를 text-3xl의 line-height에 맞춰, 제목이 도착해도 높이가 변하지 않게 한다.
              */}
              <span
                className="block h-9 w-48 animate-pulse rounded-control bg-surface-strong"
                aria-hidden="true"
              />
            </>
          ) : (
            title
          )}
        </h1>

        {/*
        경로 조회가 실패하면 제목이 기본 이름으로, breadcrumb이 루트만으로 떨어진다.
        정상 화면과 구분되지 않으므로 그 값들 바로 아래에서 알린다.
        */}
        {isPathError ? (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            현재 폴더 위치를 확인하지 못했습니다.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <NewFolderButton
          onClick={onCreateFolder}
          disabled={isCreateFolderDisabled}
        />
        <NewWorkspaceButton
          onClick={onCreateWorkspace}
          disabled={isCreateWorkspaceDisabled}
        />
      </div>
    </header>
  );
}
