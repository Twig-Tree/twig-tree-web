import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex h-full min-h-0 items-center justify-center bg-slate-50 px-6 py-10">
      {children}
    </main>
  );
}
