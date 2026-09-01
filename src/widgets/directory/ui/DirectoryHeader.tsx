import { NewFolderButton } from "@/src/features/folder/create-folder";
import { NewWorkspaceButton } from "@/src/features/workspace/create-workspace";
import { Breadcrumb, type BreadcrumbItem } from "@/src/shared/ui/breadcrumb";

export interface DirectoryHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  isTitleLoading?: boolean; // 제목을 처음 불러오는 중이라 자리표시자를 보여줄지 여부
  isPathError?: boolean; // 상위 경로를 불러오지 못해 제목과 breadcrumb을 믿을 수 없는 상태인지 여부
  onCreateFolder?: () => void;
  isCreateFolderDisabled?: boolean;
}

export function DirectoryHeader({
  title,
  breadcrumbs,
  isTitleLoading = false,
  isPathError = false,
  onCreateFolder,
  isCreateFolderDisabled = false,
}: DirectoryHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Breadcrumb items={breadcrumbs} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {isTitleLoading ? (
            <>
              <span className="sr-only">폴더 이름을 불러오는 중입니다.</span>
              {/*
              자리표시자의 높이를 text-3xl의 line-height에 맞춰, 제목이 도착해도 높이가 변하지 않게 한다.
              */}
              <span
                className="block h-9 w-48 animate-pulse rounded-lg bg-slate-200"
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
          <p role="alert" className="mt-2 text-sm font-medium text-red-600">
            현재 폴더 위치를 확인하지 못했습니다.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <NewFolderButton
          onClick={onCreateFolder}
          disabled={isCreateFolderDisabled}
        />
        <NewWorkspaceButton />
      </div>
    </header>
  );
}
