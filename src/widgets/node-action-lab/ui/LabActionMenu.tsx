import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  NODE_ACTION_IDS,
  NODE_ACTION_LABELS,
  type NodeActionId,
} from "../model/nodeActions";
import { NODE_ACTION_ICONS } from "./nodeActionIcons";

const MENU_EDGE_GAP = 8; // 메뉴가 캔버스 가장자리에 붙지 않도록 남기는 여백(px)

type LabActionMenuProps = {
  x: number; // 캔버스 왼쪽 위를 기준으로 한 메뉴 위치
  y: number;
  getBlockReason: (actionId: NodeActionId) => string | null; // 막힌 동작은 비활성으로 두고 이유를 보여 준다
  onSelect: (actionId: NodeActionId) => void; // 고른 동작을 실행한다
  onClose: () => void; // 메뉴를 닫는다
  onEscape: () => void; // Escape로 닫는다. 메뉴를 열기 전의 자리로 focus를 돌려준다
};

/*
함수 이름 : LabActionMenu
기능 : 실험실의 노드 동작 메뉴를 그린다. 모양과 키보드 동작(방향키 이동, Escape, 밖을 누르면 닫힘)은 제품의 NodeContextMenu를 따르고,
항목은 실험실 동작 목록에서 만든다. 막힌 동작은 비활성으로 두고 이유를 함께 적는다.
인자 : LabActionMenuProps
반환값 : 노드 동작 메뉴

제품 메뉴에 실험용 prop을 넣지 않으려고 따로 둔다. 진입 방식과 단축키 표기를 바꿔 볼 때 이 메뉴만 고친다.
*/
export function LabActionMenu({
  x,
  y,
  getBlockReason,
  onSelect,
  onClose,
  onEscape,
}: LabActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation(); // 메뉴 안의 키가 캔버스 단축키로 넘어가지 않게 한다

    if (event.key === "Escape") {
      event.preventDefault();
      onEscape();
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

  /*
  Tab으로 focus가 메뉴 밖으로 옮겨 가면 닫는다. 메뉴 여백을 누르면 다음 focus가 없어 닫지 않는다.
  */
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget;
    if (!(nextFocused instanceof Node)) return;
    if (menuRef.current?.contains(nextFocused)) return;

    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="노드 메뉴"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onContextMenu={(event) => event.preventDefault()}
      style={{ left: position.left, top: position.top }}
      className="absolute z-20 min-w-44 rounded-control border border-line bg-surface p-1 shadow-overlay"
    >
      {NODE_ACTION_IDS.map((actionId) => {
        const Icon = NODE_ACTION_ICONS[actionId];
        const blockReason = getBlockReason(actionId);
        const isDanger = actionId === "delete";

        return (
          <button
            key={actionId}
            type="button"
            role="menuitem"
            disabled={blockReason !== null}
            title={blockReason ?? undefined}
            onClick={() => {
              onClose();
              onSelect(actionId);
            }}
            className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:text-content-disabled ${
              isDanger
                ? "text-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle disabled:hover:bg-transparent"
                : "text-content-secondary hover:bg-surface-hover focus-visible:bg-surface-hover disabled:hover:bg-transparent"
            }`}
          >
            <Icon aria-hidden className="size-4" strokeWidth={2} />
            <span className="flex flex-col">
              {NODE_ACTION_LABELS[actionId]}
              {blockReason ? (
                <span className="text-xs text-content-muted">
                  {blockReason}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
