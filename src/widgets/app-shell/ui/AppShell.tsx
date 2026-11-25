import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/src/shared/config/routes";
import { Logo } from "@/src/shared/ui/logo";

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

  /*
  소개 페이지는 문서 전체가 스크롤되어야 하므로 스크롤 잠금은 body가 아니라 앱 셸이 갖는다.
  */
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center border-b border-line bg-surface px-5">
        <Link
          href={homeLink.href}
          aria-label={homeLink.label}
          className="-ml-2 rounded-control focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
        >
          {/*
          이미지 왼쪽의 투명 여백을 음수 margin으로 상쇄해 메뉴바 아이콘 열과 맞춘다.
          */}
          <Logo alt="" isEager className="h-11" />
        </Link>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
