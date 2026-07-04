import "./globals.css";
import { QueryProvider } from "@/src/shared/lib/react-query/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
      </body>
    </html>
  );
}
