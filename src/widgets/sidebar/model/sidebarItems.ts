import { CircleStar, Clock, Folder, Settings } from "lucide-react";
import { routes } from "@/src/shared/config/routes";
import type { SidebarItem } from "./types";

export const sidebarItems: SidebarItem[] = [
  { icon: CircleStar, label: "대시보드", href: routes.dashboard },
  {
    icon: Folder,
    label: "폴더",
    href: routes.directoryRoot,
    activePrefix: routes.directoryRoot,
  },
  { icon: Clock, label: "최근 항목", href: routes.recent },
];

export const settingsSidebarItem: SidebarItem = {
  icon: Settings,
  label: "설정",
  href: routes.settings,
  activePrefix: routes.settings,
};
