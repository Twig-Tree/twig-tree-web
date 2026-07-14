import { Sidebar } from "@/src/widgets/sidebar";
import type { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-full min-h-0">
      <Sidebar />
      <main className="min-h-0 min-w-0 flex-1 bg-white">{children}</main>
    </div>
  );
}
