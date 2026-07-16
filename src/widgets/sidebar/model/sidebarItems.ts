import { routes } from "@/src/shared/config/routes";
import type { SidebarItem } from "./types";

export const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: routes.dashboard },
  {
    label: "Directory",
    href: routes.directoryDefault,
    activePrefix: routes.directoryDefault,
  },
  { label: "Recent", href: routes.recent },
  {
    label: "Workspace",
    href: routes.workspaceDefault,
    activePrefix: routes.workspaceRoot,
  },
];
