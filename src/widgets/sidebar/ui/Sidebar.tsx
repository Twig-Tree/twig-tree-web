"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarItems } from "../model/sidebarItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 shrink-0 border-r border-line bg-surface-muted px-3 py-5">
      <nav className="flex flex-col items-center gap-1" aria-label="주 메뉴">
        {sidebarItems.map((item) => {
          /*
          activePrefix가 있을 시, activePrefix와 정확히 일치하거나 그것으로 시작하는 경로이면 버튼을 활성화한다.
          activePrefix가 없을 시, 현재 경로와 아이템 경로가 정확히 일치해야 활성화한다.
          */
          const isActive = item.activePrefix
            ? pathname === item.activePrefix ||
              pathname.startsWith(`${item.activePrefix}/`)
            : pathname === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
                isActive
                  ? "bg-surface text-accent shadow-control ring-1 ring-line"
                  : "text-content-secondary hover:bg-surface hover:text-content"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {/*
              라벨은 툴팁으로 보여준다. 평소에는 투명하게만 숨겨 접근성 트리에 남겨 두므로, 아이콘만 보이는 링크도 라벨을 이름으로 갖는다.
              마우스뿐 아니라 키보드 포커스에서도 보이도록 focus-visible에도 띄운다.
              */}
              <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-control bg-inverse px-2 py-1 text-xs font-medium whitespace-nowrap text-on-inverse opacity-0 shadow-control transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
