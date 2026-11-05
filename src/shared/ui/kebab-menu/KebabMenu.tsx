"use client";

import { Check } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

export interface KebabMenuItem {
  checked?: boolean; // 여럿 중 하나를 고르는 항목의 선택 여부. 생략하면 일반 항목이다
  disabled?: boolean; // 선택할 수 없는 항목인지 여부
  hasDividerBefore?: boolean; // 앞 항목과 구분하는 선을 그을지 여부
  id: string; // React key와 항목 식별에 사용할 값
  label: string; // 메뉴에 표시할 이름
  onSelect?: () => void; // 항목 선택 시 실행할 callback
  tone?: "default" | "danger"; // 항목의 의미에 따른 색상
}

interface KebabMenuProps {
  ariaLabel?: string;
  items: KebabMenuItem[];
  trigger?: ReactNode; // 트리거 버튼 안에 표시할 내용. 생략하면 점 3개를 표시한다
  triggerClassName?: string; // 트리거 버튼 스타일. 생략하면 아이콘 버튼 스타일을 사용한다
}

const DEFAULT_TRIGGER_CLASS_NAME =
  "flex h-8 w-8 items-center justify-center rounded-control text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const DEFAULT_TRIGGER = (
  <span className="flex flex-col gap-0.5" aria-hidden="true">
    <span className="h-1 w-1 rounded-full bg-current" />
    <span className="h-1 w-1 rounded-full bg-current" />
    <span className="h-1 w-1 rounded-full bg-current" />
  </span>
);

/*
함수 이름 : KebabMenu
기능 : 점 3개 버튼으로 메뉴를 열고 항목 선택, 바깥 클릭, Escape 입력에 따라 메뉴 상태를 관리한다. 위아래 화살표로 항목 사이를 이동한다.
인자 : KebabMenuProps
반환값 : 여러 화면에서 재사용할 수 있는 케밥 메뉴 UI
*/
export function KebabMenu({
  ariaLabel = "더보기",
  items,
  trigger = DEFAULT_TRIGGER,
  triggerClassName = DEFAULT_TRIGGER_CLASS_NAME,
}: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /*
  메뉴가 열린 동안에만 전역 이벤트를 구독해 바깥 클릭과 Escape 입력으로 메뉴를 닫는다.
  */
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      /*
      선택할 수 없는 항목은 건너뛰고 끝에서는 반대쪽 끝으로 돌아간다.
      포커스가 아직 트리거에 있으면 아래 방향은 첫 항목, 위 방향은 마지막 항목으로 간다.
      */
      const menuItems = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ) ?? [],
      );

      if (menuItems.length === 0) return;

      event.preventDefault();

      const focusedIndex = menuItems.findIndex(
        (menuItem) => menuItem === document.activeElement,
      );
      const nextIndex =
        event.key === "ArrowDown"
          ? (focusedIndex + 1) % menuItems.length
          : (focusedIndex <= 0 ? menuItems.length : focusedIndex) - 1;

      menuItems[nextIndex].focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-9 z-30 min-w-36 rounded-control border border-line bg-surface p-1 shadow-overlay"
        >
          {items.map((item) => (
            <Fragment key={item.id}>
              {item.hasDividerBefore ? (
                <div role="separator" className="my-1 border-t border-line" />
              ) : null}
              <button
                type="button"
                role={item.checked === undefined ? "menuitem" : "menuitemradio"}
                aria-checked={item.checked}
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  if (item.disabled) return;

                  /*
                  항목이 사라지면 포커스를 잃으므로 트리거로 돌린다. onSelect가 모달을 열면 포커스를 가져가도록 먼저 돌린다.
                  */
                  setIsOpen(false);
                  triggerRef.current?.focus();
                  item.onSelect?.();
                }}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-content-disabled ${
                  item.tone === "danger"
                    ? "text-danger hover:bg-danger-subtle"
                    : "text-content-secondary hover:bg-surface-hover"
                }`}
              >
                {item.label}
                {item.checked ? (
                  <Check aria-hidden className="size-4 text-accent" />
                ) : null}
              </button>
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}
