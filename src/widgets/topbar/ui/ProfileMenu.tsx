"use client";

import { useSyncExternalStore } from "react";
import { useLogout } from "@/src/features/auth/logout";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { KebabMenu } from "@/src/shared/ui/kebab-menu";

// 서버에서는 sessionStorage에 접근할 수 없으므로 로그인하지 않은 상태로 렌더링한다.
const getServerSnapshot = () => false;

/*
함수 이름 : ProfileMenu
기능 : 상단바의 프로필 이미지를 눌러 메뉴를 열고 로그아웃을 실행한다.
인자 : 없음
반환값 : 로그인한 경우 프로필 메뉴, 로그인하지 않은 경우 아무것도 렌더링하지 않는다
*/
export function ProfileMenu() {
  /*
  상단바는 로그인 화면에도 그려진다. 프로필은 로그인한 사용자를 가리키는 UI이므로
  토큰이 없으면 자리 표시자를 남기지 않고 감춘다.
  authSession을 구독해 로그인과 로그아웃 직후 상태가 바로 반영되게 한다.
  */
  const hasAccessToken = useSyncExternalStore(
    authSession.subscribe,
    authSession.hasAccessToken,
    getServerSnapshot,
  );

  const { logout, isLoggingOut } = useLogout();

  if (!hasAccessToken) {
    return null;
  }

  return (
    <KebabMenu
      ariaLabel="프로필 메뉴"
      triggerClassName="group flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      trigger={
        <span
          className="h-8 w-8 rounded-full bg-slate-200 ring-1 ring-slate-300 transition-colors group-hover:bg-slate-300"
          aria-hidden="true"
        />
      }
      items={[
        {
          id: "logout",
          label: isLoggingOut ? "로그아웃 중..." : "로그아웃",
          tone: "danger",
          disabled: isLoggingOut,
          onSelect: () => void logout(),
        },
      ]}
    />
  );
}
