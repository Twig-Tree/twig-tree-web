import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import type { FolderItem } from "../model/types";

interface FolderCardProps {
  folder: FolderItem;
}

export function FolderCard({ folder }: FolderCardProps) {
  return (
    <article className="group relative flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {folder.id !== null ? (
        <Link
          href={routes.directory(folder.id)}
          aria-label={`${folder.name} 폴더 열기`}
          className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        />
      ) : null}

      <div
        className="pointer-events-none relative flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50"
        aria-hidden="true"
      >
        <span className="relative block h-4 w-5 rounded-[3px] bg-indigo-600 before:absolute before:-top-1 before:left-0 before:h-1.5 before:w-2.5 before:rounded-t-[2px] before:bg-indigo-600" />
      </div>
      <h2 className="pointer-events-none relative text-base font-semibold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700">
        {folder.name}
      </h2>
    </article>
  );
}
