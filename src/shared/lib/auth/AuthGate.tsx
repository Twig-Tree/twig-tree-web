"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAuthRequired } from "@/src/shared/config/auth";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "./authSession";

interface AuthGateProps {
  children: ReactNode;
}

// hydration 상태는 구독할 외부 이벤트가 없으므로 빈 구독 해제 함수를 반환한다.
const subscribeToHydration = () => () => undefined;

// 클라이언트에서는 hydration이 완료된 상태를 반환한다.
const getClientSnapshot = () => true;

// 서버에서는 hydration 전 상태이며 sessionStorage에도 접근할 수 없으므로 false를 반환한다.
const getServerSnapshot = () => false;

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();

  /*
   * 첫 번째 외부 저장소 구독은 hydration 여부를 읽는다.
   * 서버의 false snapshot으로 시작한 뒤 클라이언트의 true snapshot으로 전환해
   * 서버와 클라이언트의 최초 렌더링 결과가 달라지는 것을 방지한다.
   */
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  /*
   * 두 번째 외부 저장소 구독은 access token 존재 여부를 읽는다.
   * authSession이 토큰 변경을 알리면 React가 hasAccessToken을 다시 실행하고
   * 반환값이 달라진 경우 AuthGate를 다시 렌더링한다.
   */
  const hasAccessToken = useSyncExternalStore(
    authSession.subscribe,
    authSession.hasAccessToken,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isAuthRequired || !isHydrated || hasAccessToken) {
      return;
    }

    router.replace(routes.login);
  }, [hasAccessToken, isHydrated, router]);

  if (isAuthRequired && (!isHydrated || !hasAccessToken)) {
    return null;
  }

  return children;
}
