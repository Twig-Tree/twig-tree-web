"use client";

import { usePathname } from "next/navigation";
import { settingsSidebarItem, sidebarItems } from "../model/sidebarItems";
import { SidebarLink } from "./SidebarLink";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-line bg-surface-muted px-3 py-5">
      <nav className="flex flex-col items-center gap-1" aria-label="주 메뉴">
        {sidebarItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/*
      설정처럼 페이지 이동이 아닌 계정 관련 메뉴는 메뉴바 맨 아래에 붙인다.
      */}
      <nav
        className="mt-auto flex flex-col items-center gap-1"
        aria-label="계정 메뉴"
      >
        <SidebarLink item={settingsSidebarItem} pathname={pathname} />
      </nav>
    </aside>
  );
}
