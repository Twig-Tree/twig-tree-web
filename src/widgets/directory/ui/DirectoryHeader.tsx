import { NewFolderButton } from "@/src/features/folder/create-folder";
import { NewWorkspaceButton } from "@/src/features/workspace/create-workspace";
import { Breadcrumb, type BreadcrumbItem } from "@/src/shared/ui/breadcrumb";

export interface DirectoryHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

export function DirectoryHeader({ title, breadcrumbs }: DirectoryHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Breadcrumb items={breadcrumbs} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <NewFolderButton />
        <NewWorkspaceButton />
      </div>
    </header>
  );
}
