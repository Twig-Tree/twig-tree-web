"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import {
  getDragMoveItemId,
  getDragMoveTargetId,
  isDroppableTarget,
  type DragMoveItem,
  type DragMoveTarget,
} from "../lib/dragMove";
import { useDirectoryDragMove } from "./DirectoryDragMoveProvider";

interface DraggableDirectoryItemProps {
  children: ReactNode; // 감쌀 카드. 카드는 끌기를 모른다
  item: DragMoveItem; // 이 카드가 나타내는 항목
}

/*
함수 이름 : DraggableDirectoryItem
기능 : 디렉토리 카드를 끌 수 있게 감싸고, 폴더 카드면 다른 항목을 놓을 수 있는 곳으로도 만든다.
인자 : DraggableDirectoryItemProps
반환값 : 끌기와 놓기가 붙은 카드

entity 카드가 드래그를 모르도록 바깥 div가 마우스 이벤트를 받는다.
dnd-kit의 attributes(role="button", tabIndex)는 붙이지 않는다. 키보드로 끌기를 켜지 않아, 붙이면 카드마다 쓸모없는 탭 정지가 하나씩 생긴다.
*/
export function DraggableDirectoryItem({
  children,
  item,
}: DraggableDirectoryItemProps) {
  const { directoryFolderId } = useDirectoryDragMove();
  const folderId = item.kind === "folder" ? item.folder.id : null;

  const {
    setNodeRef: setDraggableRef,
    listeners,
    isDragging,
  } = useDraggable({ id: getDragMoveItemId(item), data: item });

  const target: DragMoveTarget = { folderId };
  const {
    setNodeRef: setDroppableRef,
    isOver,
    active,
  } = useDroppable({
    id: getDragMoveTargetId("card", folderId),
    data: target,
    disabled: item.kind !== "folder",
  });

  const activeItem = active?.data.current as DragMoveItem | undefined;
  const isDropHighlighted =
    isOver &&
    activeItem !== undefined &&
    isDroppableTarget(activeItem, folderId, directoryFolderId);

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      /*
      링크와 이미지는 브라우저 기본 끌기가 있다. 그대로 두면 브라우저가 마우스 이벤트를 가져가 dnd-kit의 끌기가 시작되지 않는다.
      */
      onDragStartCapture={(event) => event.preventDefault()}
      data-drop-highlighted={isDropHighlighted || undefined}
      className={`rounded-card transition ${isDragging ? "opacity-40" : ""} ${
        isDropHighlighted ? "ring-2 ring-accent" : ""
      }`}
    >
      {children}
    </div>
  );
}
