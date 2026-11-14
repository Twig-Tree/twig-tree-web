"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from "@dnd-kit/core";
import { Archive, Folder } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
이름표를 마우스 포인터에서 띄워 둘 거리(px). 포인터 바로 아래에 두면 놓을 곳의 강조를 가린다.
*/
const PREVIEW_CURSOR_OFFSET = 12;

/*
함수 이름 : followCursor
기능 : 끄는 동안 이름표가 마우스 포인터 오른쪽 아래를 따라다니게 위치를 옮긴다.
인자 : Modifier 인자 -> dnd-kit이 넘기는 끌기 시작 이벤트, 원래 카드의 위치, 지금까지 움직인 거리
반환값 : 이름표를 옮길 거리

DragOverlay는 원래 카드의 왼쪽 위에서 시작한다. 이름표는 카드보다 작아, 그대로 두면 카드를 잡은 위치만큼 포인터에서 떨어져 보인다.
*/
const followCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  transform,
}) => {
  if (!(activatorEvent instanceof MouseEvent) || !activeNodeRect) {
    return transform;
  }

  return {
    ...transform,
    x:
      transform.x +
      activatorEvent.clientX -
      activeNodeRect.left +
      PREVIEW_CURSOR_OFFSET,
    y:
      transform.y +
      activatorEvent.clientY -
      activeNodeRect.top +
      PREVIEW_CURSOR_OFFSET,
  };
};

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

  const clickGuardTimeoutRef = useRef<number | null>(null); // 놓은 뒤 click 막기를 풀 예약. 없으면 null

  const clearClickGuardTimeout = useCallback(() => {
    if (clickGuardTimeoutRef.current === null) return;

    window.clearTimeout(clickGuardTimeoutRef.current);
    clickGuardTimeoutRef.current = null;
  }, []);

  /*
  끄는 도중이나 놓은 직후에 화면을 떠나면 해제 예약이 돌기 전에 사라질 수 있다.
  남은 click 막기를 지우고 예약도 취소한다. 예약이 남으면 화면이 없어진 뒤에 돌아, 테스트에서는 jsdom이 내려간 뒤 window를 찾다 실패한다.
  */
  useEffect(
    () => () => {
      clearClickGuardTimeout();
      window.removeEventListener("click", preventClick, { capture: true });
    },
    [clearClickGuardTimeout],
  );

  /*
  앞서 놓은 뒤의 해제 예약이 남아 있으면 취소한다. 그대로 두면 새로 끄는 도중에 click 막기가 풀린다.
  */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      clearClickGuardTimeout();
      window.addEventListener("click", preventClick, { capture: true });
      setActiveItem((event.active.data.current as DragMoveItem) ?? null);
    },
    [clearClickGuardTimeout],
  );

  /*
  놓은 직후의 click까지 막은 뒤 풀어, 다음 클릭은 평소처럼 카드를 연다.
  */
  const releaseClickGuard = useCallback(() => {
    clearClickGuardTimeout();
    clickGuardTimeoutRef.current = window.setTimeout(() => {
      clickGuardTimeoutRef.current = null;
      window.removeEventListener("click", preventClick, { capture: true });
    }, CLICK_GUARD_DURATION_MS);
  }, [clearClickGuardTimeout]);

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
      {/*
      놓을 곳은 마우스 포인터 위치로 정한다. 기본값처럼 끄는 카드의 사각형 전체로 겹침을 재면,
      큰 카드가 작은 브레드크럼 항목 여러 개를 한꺼번에 덮어 손이 가리키지 않은 항목에 놓일 수 있다.
      */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null} modifiers={[followCursor]}>
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
