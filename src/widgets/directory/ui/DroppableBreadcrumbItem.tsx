"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import {
  getDragMoveTargetId,
  isDroppableTarget,
  type DragMoveItem,
  type DragMoveTarget,
} from "../lib/dragMove";
import { useDirectoryDragMove } from "./DirectoryDragMoveProvider";

interface DroppableBreadcrumbItemProps {
  children: ReactNode; // 감쌀 경로 항목. 항목은 놓기를 모른다
  folderId: string | null; // 이 항목이 가리키는 폴더 ID. 루트("내 폴더")는 null
}

/*
함수 이름 : DroppableBreadcrumbItem
기능 : 브레드크럼의 경로 항목을 끌고 있는 카드를 놓을 수 있는 곳으로 만든다.
인자 : DroppableBreadcrumbItemProps
반환값 : 놓기가 붙은 경로 항목

현재 위치 항목도 감싼다. 화면의 카드는 모두 현재 위치에 들어 있어 isDroppableTarget이 막으므로, 따로 빼지 않아도 강조되거나 요청이 나가지 않는다.
*/
export function DroppableBreadcrumbItem({
  children,
  folderId,
}: DroppableBreadcrumbItemProps) {
  const { directoryFolderId } = useDirectoryDragMove();
  const target: DragMoveTarget = { folderId };
  const { setNodeRef, isOver, active } = useDroppable({
    id: getDragMoveTargetId("breadcrumb", folderId),
    data: target,
  });

  const activeItem = active?.data.current as DragMoveItem | undefined;
  const isDropHighlighted =
    isOver &&
    activeItem !== undefined &&
    isDroppableTarget(activeItem, folderId, directoryFolderId);

  /*
  글자가 작아 놓을 곳을 맞추기 어렵다. 안쪽 여백으로 받는 영역을 넓히고, 같은 만큼 바깥 여백을 빼 배치는 그대로 둔다.
  */
  return (
    <span
      ref={setNodeRef}
      data-drop-highlighted={isDropHighlighted || undefined}
      className={`-mx-1.5 -my-1 rounded-control px-1.5 py-1 transition ${
        isDropHighlighted
          ? "bg-accent-subtle text-accent ring-2 ring-accent"
          : ""
      }`}
    >
      {children}
    </span>
  );
}
