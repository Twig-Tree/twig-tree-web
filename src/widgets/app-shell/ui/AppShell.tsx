import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/src/shared/config/routes";
import { SiteHeader } from "@/src/shared/ui/site-header";

/*
dashboard : 로그인한 화면. 로그인하지 않았으면 대시보드의 인증 확인이 로그인 화면으로 보낸다.
landing   : 로그인 전 화면. 로고를 누르면 소개 페이지로 돌아간다.
*/
type AppShellHome = "dashboard" | "landing";

const HOME_LINK: Record<AppShellHome, { href: string; label: string }> = {
  dashboard: { href: routes.dashboard, label: "Twig Tree 대시보드로 이동" },
  landing: { href: routes.landing, label: "Twig Tree 소개 페이지로 이동" },
};

interface AppShellProps {
  children: ReactNode;
  home?: AppShellHome; // 상단바 로고를 눌렀을 때 갈 화면
}

/*
함수 이름 : AppShell
기능 : 앱 화면(로그인·메인·개발 도구)에 상단바를 붙이고, 화면 높이에 맞춘 셸 안에서 각 화면이 스크롤을 직접 관리하게 한다.
인자 : AppShellProps
반환값 : 상단바와 children을 담은 셸
*/
export function AppShell({ children, home = "dashboard" }: AppShellProps) {
  const homeLink = HOME_LINK[home];
  const isSignedInScreen = home === "dashboard";

  /*
  소개 페이지는 문서 전체가 스크롤되어야 하므로 스크롤 잠금은 body가 아니라 앱 셸이 갖는다.
  */
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <SiteHeader
        homeHref={homeLink.href}
        homeLabel={homeLink.label}
        tone="themed"
        hasDivider={isSignedInScreen} // 로그인한 화면은 상단바와 작업 공간을 선으로 나눈다
        actions={
          /*
          로그인한 화면은 로고가 대시보드로 가므로, 소개 페이지로 가는 길을 따로 둔다.
          작업 화면의 주된 동작과 겹치지 않도록 바탕 없이 글자만 둔다.
          */
          isSignedInScreen && (
            <Link
              href={routes.landing}
              className="rounded-control px-3 py-2 text-sm font-semibold text-content-secondary hover:text-content focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
            >
              서비스 소개
            </Link>
          )
        }
      />

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
