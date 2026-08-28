import { NewFolderButton } from "@/src/features/folder/create-folder";
import { NewWorkspaceButton } from "@/src/features/workspace/create-workspace";
import { Breadcrumb, type BreadcrumbItem } from "@/src/shared/ui/breadcrumb";

export interface DirectoryHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  isTitlePending?: boolean; // 제목을 아직 받지 못해 자리표시자를 보여줄지 여부
  onCreateFolder?: () => void;
  isCreateFolderDisabled?: boolean;
}

export function DirectoryHeader({
  title,
  breadcrumbs,
  isTitlePending = false,
  onCreateFolder,
  isCreateFolderDisabled = false,
}: DirectoryHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Breadcrumb items={breadcrumbs} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {isTitlePending ? (
            /*
            자리표시자의 높이를 text-3xl의 line-height에 맞춰, 제목이 도착해도 높이가 변하지 않게 한다.
            */
            <span
              className="block h-9 w-48 animate-pulse rounded-lg bg-slate-200"
              aria-hidden="true"
            />
          ) : (
            title
          )}
        </h1>
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
