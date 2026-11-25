import { AppShell } from "@/src/widgets/app-shell";
import type { ReactNode } from "react";

interface DevLayoutProps {
  children: ReactNode;
}

export default function DevLayout({ children }: DevLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
