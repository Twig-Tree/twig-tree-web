"use client";

import { Folder } from "lucide-react";
import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { KebabMenu } from "@/src/shared/ui/kebab-menu";
import type { FolderItem } from "../model/types";

interface FolderCardProps {
  folder: FolderItem;
  onDelete?: () => void;
  onRename: () => void;
}

export function FolderCard({ folder, onDelete, onRename }: FolderCardProps) {
  return (
    <article className="group relative flex min-h-36 flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={routes.directory(folder.id)}
        aria-label={`${folder.name} 폴더 열기`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      />

      <div className="absolute right-3 top-3 z-10">
        <KebabMenu
          ariaLabel={`${folder.name} 폴더 메뉴`}
          items={[
            {
              id: "rename",
              label: "이름 수정하기",
              onSelect: onRename,
            },
            {
              id: "delete",
              label: "삭제하기",
              tone: "danger",
              disabled: !onDelete,
              onSelect: onDelete,
            },
          ]}
        />
      </div>

      <div
        className="pointer-events-none relative flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50"
        aria-hidden="true"
      >
        <Folder className="h-5 w-5 text-indigo-600 fill-current" />
      </div>
      <h2 className="pointer-events-none relative text-base font-semibold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700">
        {folder.name}
      </h2>
    </article>
  );
}
