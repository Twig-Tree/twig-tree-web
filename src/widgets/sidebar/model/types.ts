import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  icon: LucideIcon; // 사이드바에 표시할 아이콘
  label: string; // 아이콘에 마우스를 올리거나 포커스하면 툴팁으로 보여줄 아이템 이름
  href: string; // 아이템 클릭 시 이동할 경로
  activePrefix?: string; // 이 경로로 시작하는 하위 경로에서도 아이템을 활성화
};
