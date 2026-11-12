import "./globals.css";
import { Network } from "lucide-react";
import { QueryProvider } from "@/src/shared/lib/react-query/QueryProvider";
import { Toaster } from "@/src/shared/ui/toast";
import {
  DEFAULT_THEME,
  getThemeInitScript,
  ThemeSync,
} from "@/src/shared/lib/theme";
import { ProfileMenu } from "@/src/widgets/topbar";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
    초기 스크립트가 hydration 전에 data-theme을 저장된 테마로 바꾸므로 서버 HTML과 달라질 수 있다.
    */
    <html
      lang="ko"
      data-theme={DEFAULT_THEME}
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body className="h-full overflow-hidden bg-surface text-content">
        <ThemeSync />
        <QueryProvider>
          <div className="flex h-dvh flex-col">
            {/* Topbar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-5">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-control bg-accent text-on-accent"
                  aria-hidden="true"
                >
                  <Network className="h-4 w-4" />
                </span>
                <span className="text-base font-semibold tracking-tight text-content">
                  Twig Tree
                </span>
              </div>
              <ProfileMenu />
            </header>

            <div className="min-h-0 flex-1">{children}</div>
          </div>
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
      </body>
    </html>
  );
}
