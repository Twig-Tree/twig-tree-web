"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Archive, Folder } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useMoveFolderByDrop } from "@/src/features/folder/move-folder";
import { useMoveWorkspaceByDrop } from "@/src/features/workspace/move-workspace";
import {
  isDroppableTarget,
  type DragMoveItem,
  type DragMoveTarget,
} from "../lib/dragMove";

/*
끌기 시작으로 보는 이동 거리(px). 이보다 짧게 움직이고 떼면 클릭으로 남아 카드가 열린다.
*/
const DRAG_ACTIVATION_DISTANCE = 8;

/*
끌기가 끝난 뒤 click을 막아 두는 시간(ms). dnd-kit이 click 전파를 막아 두는 시간과 같게 맞춘다.
*/
const CLICK_GUARD_DURATION_MS = 50;

/*
함수 이름 : preventClick
기능 : 끌고 놓은 직후 브라우저가 보내는 click의 기본 동작을 막는다.
인자 : MouseEvent event -> 막을 click 이벤트
반환값 : 없음

dnd-kit은 이 click을 document 캡처 단계에서 전파만 막고 기본 동작은 두어, 카드 링크가 그대로 열린다.
그보다 먼저 받는 window 캡처 단계에서 기본 동작을 막는다. React의 click handler는 document 아래에서 받으므로 카드에서는 막을 수 없다.
*/
const preventClick = (event: MouseEvent) => {
  event.preventDefault();
};

interface DirectoryDragMoveContextValue {
  directoryFolderId: string | null; // 지금 보고 있는 디렉토리의 폴더 ID. 루트는 null
}

const DirectoryDragMoveContext =
  createContext<DirectoryDragMoveContextValue | null>(null);

/*
함수 이름 : useDirectoryDragMove
기능 : 드래그 이동 영역 안에서 지금 보고 있는 디렉토리를 읽는다.
인자 : 없음
반환값 : DirectoryDragMoveContextValue
*/
export function useDirectoryDragMove(): DirectoryDragMoveContextValue {
  const value = useContext(DirectoryDragMoveContext);

  if (!value) {
    throw new Error(
      "useDirectoryDragMove는 DirectoryDragMoveProvider 안에서만 쓸 수 있습니다.",
    );
  }

  return value;
}

interface DirectoryDragMoveProviderProps {
  children: ReactNode; // 끌 카드와 놓을 곳을 담은 화면. 헤더의 브레드크럼까지 감싼다
  folderParentId: string | null; // 지금 보고 있는 디렉토리의 폴더 ID. 루트는 null
}

/*
함수 이름 : DirectoryDragMoveProvider
기능 : 디렉토리 화면의 카드를 끌어 폴더로 옮길 수 있게 dnd-kit 영역을 열고, 놓으면 이동을 요청한다.
인자 : DirectoryDragMoveProviderProps
반환값 : 드래그 이동 영역

마우스로만 끈다. 터치로 끌기를 켜면 손가락으로 화면을 내리는 동작과 겹치므로, 모바일은 카드 메뉴의 "이동하기"로 옮긴다.
키보드로 끄는 것도 켜지 않는다. 키보드 사용자도 같은 메뉴로 옮길 수 있다.
*/
export function DirectoryDragMoveProvider({
  children,
  folderParentId,
}: DirectoryDragMoveProviderProps) {
  const { moveFolderByDrop } = useMoveFolderByDrop({ folderParentId });
  const { moveWorkspaceByDrop } = useMoveWorkspaceByDrop();
  const [activeItem, setActiveItem] = useState<DragMoveItem | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
  );

  /*
  끄는 도중에 화면을 떠나면 해제 타이머가 돌기 전에 사라질 수 있어, 남은 click 막기를 함께 지운다.
  */
  useEffect(
    () => () => {
      window.removeEventListener("click", preventClick, { capture: true });
    },
    [],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    window.addEventListener("click", preventClick, { capture: true });
    setActiveItem((event.active.data.current as DragMoveItem) ?? null);
  }, []);

  /*
  놓은 직후의 click까지 막은 뒤 풀어, 다음 클릭은 평소처럼 카드를 연다.
  */
  const releaseClickGuard = useCallback(() => {
    window.setTimeout(() => {
      window.removeEventListener("click", preventClick, { capture: true });
    }, CLICK_GUARD_DURATION_MS);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      releaseClickGuard();

      const item = event.active.data.current as DragMoveItem | undefined;
      const target = event.over?.data.current as DragMoveTarget | undefined;

      if (!item || !target) return;
      if (!isDroppableTarget(item, target.folderId, folderParentId)) return;

      if (item.kind === "folder") {
        void moveFolderByDrop(item.folder, target.folderId);
        return;
      }

      void moveWorkspaceByDrop(item.workspace, target.folderId);
    },
    [folderParentId, moveFolderByDrop, moveWorkspaceByDrop, releaseClickGuard],
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    releaseClickGuard();
  }, [releaseClickGuard]);

  return (
    <DirectoryDragMoveContext.Provider
      value={{ directoryFolderId: folderParentId }}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeItem ? <DragMovePreview item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </DirectoryDragMoveContext.Provider>
  );
}

interface DragMovePreviewProps {
  item: DragMoveItem; // 끌고 있는 항목
}

/*
함수 이름 : DragMovePreview
기능 : 끄는 동안 마우스를 따라다니는 작은 이름표를 표시한다.
인자 : DragMovePreviewProps
반환값 : 끌고 있는 항목의 아이콘과 이름

카드를 통째로 복제하지 않는다. 카드는 링크와 메뉴를 담고 있어, 복제하면 같은 링크와 버튼이 화면에 둘씩 생긴다.
*/
function DragMovePreview({ item }: DragMovePreviewProps) {
  const name = item.kind === "folder" ? item.folder.name : item.workspace.name;
  const Icon = item.kind === "folder" ? Folder : Archive;

  return (
    <div className="flex w-max max-w-64 cursor-grabbing items-center gap-2 rounded-control border border-line-subtle bg-surface px-3 py-2 text-sm font-semibold text-content shadow-overlay">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </div>
  );
}
