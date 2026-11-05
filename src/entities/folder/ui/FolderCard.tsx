"use client";

import { Folder } from "lucide-react";
import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { KebabMenu } from "@/src/shared/ui/kebab-menu";
import type { FolderItem } from "../model/types";

interface FolderCardProps {
  folder: FolderItem;
  isDeleteDisabled?: boolean; // 삭제 항목을 잠시 막을지 여부. 다른 삭제 요청이 진행 중일 때 넘긴다
  onDelete: () => void; // 폴더 삭제를 시작하는 callback
  onRename: () => void; // 이름 수정을 시작하는 callback
}

export function FolderCard({
  folder,
  isDeleteDisabled = false,
  onDelete,
  onRename,
}: FolderCardProps) {
  return (
    <article className="group relative flex min-h-36 flex-col justify-between rounded-card border border-line-subtle bg-surface p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <Link
        href={routes.directory(folder.id)}
        aria-label={`${folder.name} 폴더 열기`}
        className="absolute inset-0 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
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
              disabled: isDeleteDisabled,
              onSelect: onDelete,
            },
          ]}
        />
      </div>

      <div
        className="pointer-events-none relative flex h-10 w-10 items-center justify-center rounded-control bg-accent-subtle"
        aria-hidden="true"
      >
        <Folder className="h-5 w-5 text-accent fill-current" />
      </div>
      <h2 className="pointer-events-none relative text-base font-semibold leading-snug text-content transition-colors group-hover:text-accent-hover">
        {folder.name}
      </h2>
    </article>
  );
}
