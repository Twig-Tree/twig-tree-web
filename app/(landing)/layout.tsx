import { Inter, Noto_Sans_KR } from "next/font/google";
import type { ReactNode } from "react";

const latinFont = Inter({
  subsets: ["latin"],
  variable: "--font-landing-latin",
});

/*
한글 글리프는 unicode-range로 나뉘어 필요한 조각만 받으므로 미리 받지 않는다.
*/
const koreanFont = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-landing-korean",
  preload: false,
});

interface LandingLayoutProps {
  children: ReactNode;
}

/*
소개 페이지 폰트는 앱 화면에 영향을 주지 않도록 이 route group 안에서만 선언한다.
*/
export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div
      className={`${latinFont.variable} ${koreanFont.variable} min-h-dvh bg-landing-surface font-landing`}
    >
      {children}
    </div>
  );
}
