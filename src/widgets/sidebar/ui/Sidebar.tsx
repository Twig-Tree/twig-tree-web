"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarItems } from "../model/sidebarItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-5">
      <nav className="space-y-1" aria-label="Primary">
        {sidebarItems.map((item) => {
          /*
          activePrefix가 있을 시, activePrefix와 정확히 일치하거나 그것으로 시작하는 경로이면 버튼을 활성화한다.
          activePrefix가 없을 시, 현재 경로와 아이템 경로가 정확히 일치해야 활성화한다.
          */
          const isActive = item.activePrefix
            ? pathname === item.activePrefix ||
              pathname.startsWith(`${item.activePrefix}/`)
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 w-full items-center rounded-md px-3 text-left text-sm transition-colors ${
                isActive
                  ? "bg-white font-medium text-indigo-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
