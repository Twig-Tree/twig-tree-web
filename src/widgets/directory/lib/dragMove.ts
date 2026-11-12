import type { FolderItem } from "@/src/entities/folder";
import type { WorkspaceItem } from "@/src/entities/workspace";

/*
끌고 있는 항목. dnd-kit의 active.data에 실어 놓을 곳과 드롭 handler가 함께 읽는다.
*/
export type DragMoveItem =
  | { kind: "folder"; folder: FolderItem }
  | { kind: "workspace"; workspace: WorkspaceItem };

/*
놓을 수 있는 곳. 폴더 카드와 브레드크럼 경로가 모두 "이 폴더 아래로"를 뜻한다. 루트는 null이다.
*/
export interface DragMoveTarget {
  folderId: string | null;
}

/*
함수 이름 : getDragMoveItemId
기능 : 끌 항목의 dnd-kit ID를 만든다. 폴더와 워크스페이스 ID는 값이 겹칠 수 있어 종류를 앞에 붙인다.
인자 : DragMoveItem item -> 끌 항목
반환값 : dnd-kit draggable ID
*/
export const getDragMoveItemId = (item: DragMoveItem): string =>
  item.kind === "folder"
    ? `folder:${item.folder.id}`
    : `workspace:${item.workspace.id}`;

/*
함수 이름 : getDragMoveTargetId
기능 : 놓을 곳의 dnd-kit ID를 만든다. 같은 폴더가 카드와 브레드크럼에 함께 보여도 따로 구분되도록 놓는 자리 이름을 받는다.
인자 : string slot -> 놓는 자리 이름(예: card, breadcrumb)
string | null folderId -> 놓으면 옮겨 갈 폴더 ID. 루트는 null
반환값 : dnd-kit droppable ID
*/
export const getDragMoveTargetId = (
  slot: string,
  folderId: string | null,
): string => `${slot}:${folderId ?? "root"}`;

/*
함수 이름 : getDragMoveItemLocationId
기능 : 끌고 있는 항목이 지금 들어 있는 폴더 ID를 구한다.
인자 : DragMoveItem item -> 끌고 있는 항목
string | null directoryFolderId -> 지금 보고 있는 디렉토리의 폴더 ID. 루트는 null
반환값 : 항목이 들어 있는 폴더 ID. 루트는 null

화면의 폴더는 모두 지금 디렉토리에 들어 있다. 워크스페이스는 자기 folderId를 가지고 있어 그 값을 쓴다.
*/
export const getDragMoveItemLocationId = (
  item: DragMoveItem,
  directoryFolderId: string | null,
): string | null =>
  item.kind === "folder" ? directoryFolderId : item.workspace.folderId;

/*
함수 이름 : isDroppableTarget
기능 : 끌고 있는 항목을 이 위치에 놓아 옮길 수 있는지 판단한다.
인자 : DragMoveItem item -> 끌고 있는 항목
string | null targetFolderId -> 놓으려는 위치의 폴더 ID. 루트는 null
string | null directoryFolderId -> 지금 보고 있는 디렉토리의 폴더 ID. 루트는 null
반환값 : 놓을 수 있으면 true

지금 위치는 옮길 것이 없고, 폴더 자신은 자기 아래로 갈 수 없다.
화면에 보이는 다른 폴더는 모두 형제나 조상이라, 자기 하위 폴더에 놓는 경우는 생기지 않는다.
*/
export const isDroppableTarget = (
  item: DragMoveItem,
  targetFolderId: string | null,
  directoryFolderId: string | null,
): boolean => {
  if (targetFolderId === getDragMoveItemLocationId(item, directoryFolderId)) {
    return false;
  }

  return !(item.kind === "folder" && item.folder.id === targetFolderId);
};
