import type { DirectoryItem } from "../model/types";

interface DirectoryItemCardProps {
  item: DirectoryItem;
}

export function DirectoryItemCard({ item }: DirectoryItemCardProps) {
  const isFolder = item.type === "folder";

  return (
    <article className="flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {isFolder ? (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50"
          aria-hidden="true"
        >
          <span className="relative block h-4 w-5 rounded-[3px] bg-indigo-600 before:absolute before:-top-1 before:left-0 before:h-1.5 before:w-2.5 before:rounded-t-[2px] before:bg-indigo-600" />
        </div>
      ) : null}

      <h2 className="text-base font-semibold leading-snug text-slate-800">
        {item.name}
      </h2>

      {!isFolder ? (
        <p className="text-xs text-slate-500">Modified {item.modifiedAt}</p>
      ) : null}
    </article>
  );
}
