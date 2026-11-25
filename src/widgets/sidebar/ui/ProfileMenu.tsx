"use client";

import { useSyncExternalStore } from "react";
import { useGetMyInfoQuery } from "@/src/entities/auth";
import { useLogout } from "@/src/features/auth/logout";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { DefaultAvatar } from "@/src/shared/ui/default-avatar";
import { KebabMenu } from "@/src/shared/ui/kebab-menu";

// 서버에서는 sessionStorage에 접근할 수 없으므로 로그인하지 않은 상태로 렌더링한다.
const getServerSnapshot = () => false;

/*
함수 이름 : ProfileMenu
기능 : 로그인한 동안에만 메뉴바의 프로필 메뉴를 그린다.
인자 : 없음
반환값 : 로그인한 경우 프로필 메뉴, 로그인하지 않은 경우 아무것도 렌더링하지 않는다
*/
export function ProfileMenu() {
  /*
  인증 모드가 optional이면 메뉴바가 로그인하지 않은 상태에서도 그려진다. 프로필은 로그인한 사용자를 가리키는 UI이므로
  토큰이 없으면 자리 표시자를 남기지 않고 감춘다.
  authSession을 구독해 로그인과 로그아웃 직후 상태가 바로 반영되게 한다.
  */
  const hasAccessToken = useSyncExternalStore(
    authSession.subscribe,
    authSession.hasAccessToken,
    getServerSnapshot,
  );

  /*
  메뉴의 상태를 로그인한 동안만 그리는 컴포넌트에 두어, 세션이 끝나면 상태도 함께 버린다.
  */
  return hasAccessToken ? <SignedInProfileMenu /> : null;
}

/*
함수 이름 : SignedInProfileMenu
기능 : 프로필 이미지를 눌러 메뉴를 열고, 내 이름과 이메일을 보여 주며 로그아웃을 실행한다. 메뉴는 메뉴바 오른쪽으로 펼친다.
인자 : 없음
반환값 : 프로필 메뉴
*/
function SignedInProfileMenu() {
  const { logout, isLoggingOut } = useLogout();
  const myInfoQuery = useGetMyInfoQuery();

  return (
    <KebabMenu
      ariaLabel="프로필 메뉴"
      header={<MyInfo query={myInfoQuery} />}
      placement="right-end"
      triggerClassName="group flex h-10 w-10 items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      trigger={
        <DefaultAvatar className="h-8 w-8 ring-1 ring-line-strong transition-colors group-hover:bg-line-strong" />
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

interface MyInfoProps {
  query: ReturnType<typeof useGetMyInfoQuery>; // 내 정보 조회 query
}

/*
함수 이름 : MyInfo
기능 : 내 정보 조회 상태에 따라 이름과 이메일, 불러오는 중, 오류 안내 중 하나를 그린다.
인자 : MyInfoProps
반환값 : 프로필 메뉴 상단의 내 정보 영역
*/
function MyInfo({ query }: MyInfoProps) {
  if (query.isPending) {
    return <p className="text-sm text-content-muted">불러오는 중...</p>;
  }

  if (query.isError) {
    return (
      <p className="text-sm text-content-muted">
        내 정보를 불러오지 못했습니다.
      </p>
    );
  }

  /*
  메뉴가 메뉴바 옆으로 펼쳐지므로 긴 이메일이 화면을 넘지 않게 폭을 제한하고 말줄임한다.
  */
  return (
    <div className="max-w-60">
      <p className="truncate text-sm font-semibold text-content">
        {query.data.name}
      </p>
      <p className="truncate text-xs text-content-muted">{query.data.email}</p>
    </div>
  );
}
