import { NewWorkspaceButton } from "@/src/features/workspace/create-workspace";
import { Breadcrumb, type BreadcrumbItem } from "@/src/shared/ui/breadcrumb";
import { Button } from "@/src/shared/ui/button";

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
        <Button variant="secondary">
          <span
            className="h-3.5 w-4 rounded-sm border-2 border-current"
            aria-hidden="true"
          />
          New Folder
        </Button>
        <NewWorkspaceButton />
      </div>
    </header>
  );
}
