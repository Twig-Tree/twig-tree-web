import { GoogleOAuthProvider } from "@/src/shared/lib/google-oauth/GoogleOAuthProvider";
import type { ReactNode } from "react";

const getGoogleClientId = (): string => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.",
    );
  }

  return clientId;
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <GoogleOAuthProvider clientId={getGoogleClientId()}>
      <main className="flex h-full min-h-0 items-center justify-center bg-slate-50 px-6 py-10">
        {children}
      </main>
    </GoogleOAuthProvider>
  );
}
