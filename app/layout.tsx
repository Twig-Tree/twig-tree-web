import "./globals.css";
import { QueryProvider } from "@/src/shared/lib/react-query/QueryProvider";
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
              <div className="text-base font-semibold tracking-tight text-slate-900">
                Twig Tree
              </div>
              <div
                className="h-8 w-8 rounded-full bg-slate-200 ring-1 ring-slate-300"
                aria-label="Profile placeholder"
                role="img"
              />
            </header>

            <div className="min-h-0 flex-1">{children}</div>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
      </body>
    </html>
  );
}
