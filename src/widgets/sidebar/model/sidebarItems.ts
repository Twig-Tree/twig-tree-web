import { CircleStar, Clock, Copy, Archive } from "lucide-react";
import { routes } from "@/src/shared/config/routes";
import type { SidebarItem } from "./types";

export const sidebarItems: SidebarItem[] = [
  { icon: CircleStar, label: "Dashboard", href: routes.dashboard },
  {
    icon: Copy,
    label: "Directory",
    href: routes.directoryRoot,
    activePrefix: routes.directoryRoot,
  },
  { icon: Clock, label: "Recent", href: routes.recent },
  {
    icon: Archive,
    label: "Workspace",
    href: routes.workspaceDefault,
    activePrefix: routes.workspaceRoot,
  },
];
