"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface KebabMenuItem {
  disabled?: boolean; // 선택할 수 없는 항목인지 여부
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
  "flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const DEFAULT_TRIGGER = (
  <span className="flex flex-col gap-0.5" aria-hidden="true">
    <span className="h-1 w-1 rounded-full bg-current" />
    <span className="h-1 w-1 rounded-full bg-current" />
    <span className="h-1 w-1 rounded-full bg-current" />
  </span>
);

/*
함수 이름 : KebabMenu
기능 : 점 3개 버튼으로 메뉴를 열고 항목 선택, 바깥 클릭, Escape 입력에 따라 메뉴 상태를 관리한다.
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
      if (event.key !== "Escape") return;

      setIsOpen(false);
      triggerRef.current?.focus();
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
          role="menu"
          className="absolute right-0 top-9 z-30 min-w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={(event) => {
                event.stopPropagation();
                if (item.disabled) return;

                setIsOpen(false);
                item.onSelect?.();
              }}
              className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-300 ${
                item.tone === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
