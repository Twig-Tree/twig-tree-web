import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Plus, StickyNote, Trash2, type LucideIcon } from "lucide-react";

const MENU_EDGE_GAP = 8; // 메뉴가 캔버스 가장자리에 붙지 않도록 남기는 여백(px)

type NodeContextMenuProps = {
  x: number; // 캔버스 왼쪽 위를 기준으로 한 우클릭 위치
  y: number;
  onOpenMemo: () => void; // 선택한 노드의 메모 패널을 연다.
  onAddNode: () => void; // 선택한 노드에 자식 노드를 추가한다.
  onDeleteNode: () => void; // 선택한 노드를 삭제한다.
  onClose: () => void; // 메뉴를 닫는다.
  isAddNodeDisabled: boolean;
  isDeleteNodeDisabled: boolean;
};

type MenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  isDisabled: boolean;
  isDanger?: boolean;
};

/*
함수 이름 : NodeContextMenu
기능 : 우클릭한 위치에 노드 메뉴를 그린다. 메뉴 밖을 누르거나 Escape를 누르면 닫히고,
항목을 고르면 그 동작을 실행한 뒤 닫힌다. 캔버스 밖으로 넘치면 안쪽으로 당겨 놓는다.
인자 : NodeContextMenuProps
반환값 : 노드 메뉴
*/
export function NodeContextMenu({
  x,
  y,
  onOpenMemo,
  onAddNode,
  onDeleteNode,
  onClose,
  isAddNodeDisabled,
  isDeleteNodeDisabled,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  const items: MenuItem[] = [
    {
      label: "메모 열기",
      icon: StickyNote,
      onSelect: onOpenMemo,
      isDisabled: false,
    },
    {
      label: "노드 추가",
      icon: Plus,
      onSelect: onAddNode,
      isDisabled: isAddNodeDisabled,
    },
    {
      label: "노드 삭제",
      icon: Trash2,
      onSelect: onDeleteNode,
      isDisabled: isDeleteNodeDisabled,
      isDanger: true,
    },
  ];

  /*
  메뉴 크기는 그려진 뒤에야 알 수 있으므로, 화면에 보이기 전에 재서 캔버스 안쪽으로 위치를 보정한다.
  */
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const container = menu?.offsetParent;
    if (!menu || !(container instanceof HTMLElement)) return;

    const maxLeft = container.clientWidth - menu.offsetWidth - MENU_EDGE_GAP;
    const maxTop = container.clientHeight - menu.offsetHeight - MENU_EDGE_GAP;

    setPosition({
      left: Math.max(MENU_EDGE_GAP, Math.min(x, maxLeft)),
      top: Math.max(MENU_EDGE_GAP, Math.min(y, maxTop)),
    });
  }, [x, y]);

  /*
  키보드로도 바로 고를 수 있도록 열리면 첫 번째 사용 가능한 항목에 focus를 둔다.
  */
  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
  }, []);

  /*
  메뉴 밖을 누르면 닫는다. 캔버스의 pointerdown은 React Flow가 이동·선택에 쓰므로 capture 단계에서 먼저 본다.
  */
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;

      onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [onClose]);

  /*
  Escape로 닫고, 위·아래 화살표로 사용 가능한 항목 사이를 오간다.
  React Flow의 노드 삭제 단축키로 넘어가지 않도록 메뉴 안의 키 입력은 전파를 막는다.
  */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();

    const enabledItems = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    if (enabledItems.length === 0) return;

    const currentIndex = enabledItems.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const step = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      (currentIndex + step + enabledItems.length) % enabledItems.length;

    enabledItems[nextIndex].focus();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="노드 메뉴"
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      style={{ left: position.left, top: position.top }}
      className="absolute z-20 min-w-40 rounded-control border border-line bg-surface p-1 shadow-overlay"
    >
      {items.map(({ label, icon: Icon, onSelect, isDisabled, isDanger }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          disabled={isDisabled}
          onClick={() => {
            onClose();
            onSelect();
          }}
          className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:text-content-disabled ${
            isDanger
              ? "text-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle"
              : "text-content-secondary hover:bg-surface-hover focus-visible:bg-surface-hover"
          }`}
        >
          <Icon aria-hidden className="size-4" strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  );
}
