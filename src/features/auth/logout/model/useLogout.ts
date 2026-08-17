"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLogoutMutation } from "@/src/entities/auth/model/mutations/useLogoutMutation";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "@/src/shared/lib/auth/authSession";

/*
함수 이름 : useLogout
기능 : 서버의 refresh token을 폐기하고 로컬 세션과 서버 상태 캐시를 정리한 뒤 로그인 화면으로 보낸다.
인자 : 없음
반환값 : 로그아웃 핸들러와 진행 상태
*/
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useLogoutMutation();

  const logout = useCallback(async (): Promise<void> => {
    if (isPending) {
      return;
    }

    const refreshToken = authSession.getRefreshToken();

    /*
    서버 폐기에 실패해도 로컬 정리는 계속한다.
    네트워크 오류나 저장소 장애로 로그아웃이 막히면 사용자가 세션을 끝낼 방법이 없어진다.
    이 경우 서버의 refresh token은 남지만 TTL이 지나면 사라진다.
    */
    if (refreshToken) {
      try {
        await mutateAsync(refreshToken);
      } catch (error) {
        console.error("Failed to revoke refresh token", error);
      }
    }

    authSession.clearSession();
    router.replace(routes.login);

    /*
    이전 사용자의 서버 데이터가 다음 로그인 이후까지 남지 않도록 캐시를 비운다.
    세션 정리와 화면 이동이 끝난 뒤에 비워야 아직 붙어 있는 query가 다시 조회하지 않는다.
    */
    queryClient.clear();
  }, [isPending, mutateAsync, queryClient, router]);

  return {
    logout,
    isLoggingOut: isPending,
  };
}
