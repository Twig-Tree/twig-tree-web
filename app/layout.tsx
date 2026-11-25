import "./globals.css";
import { QueryProvider } from "@/src/shared/lib/react-query/QueryProvider";
import { ConfirmDialogHost } from "@/src/shared/ui/confirm-dialog";
import { Toaster } from "@/src/shared/ui/toast";
import {
  DEFAULT_THEME,
  getThemeInitScript,
  ThemeSync,
} from "@/src/shared/lib/theme";
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
      <body className="h-full bg-surface text-content">
        <ThemeSync />
        <QueryProvider>
          {children}
          <Toaster />
          <ConfirmDialogHost />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
      </body>
    </html>
  );
}
