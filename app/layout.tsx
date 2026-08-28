import "./globals.css";
import { Network } from "lucide-react";
import { QueryProvider } from "@/src/shared/lib/react-query/QueryProvider";
import { ProfileMenu } from "@/src/widgets/topbar";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full overflow-hidden bg-white text-slate-900">
        <QueryProvider>
          <div className="flex h-dvh flex-col">
            {/* Topbar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"
                  aria-hidden="true"
                >
                  <Network className="h-4 w-4" />
                </span>
                <span className="text-base font-semibold tracking-tight text-slate-900">
                  Twig Tree
                </span>
              </div>
              <ProfileMenu />
            </header>

            <div className="min-h-0 flex-1">{children}</div>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
      </body>
    </html>
  );
}
