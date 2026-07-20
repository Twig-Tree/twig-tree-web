import type { WorkspaceItem } from "../model/types";

interface WorkspaceCardProps {
  workspace: WorkspaceItem;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <article className="flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <h2 className="text-base font-semibold leading-snug text-slate-800">
        {workspace.name}
      </h2>
      <p className="text-xs text-slate-500">Modified {workspace.modifiedAt}</p>
    </article>
  );
}
