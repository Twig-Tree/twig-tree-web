"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useWithdrawMutation } from "@/src/entities/auth";
import { markSessionEnded } from "@/src/shared/api/restoreSession";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "@/src/shared/lib/auth/authSession";

/*
함수 이름 : useWithdraw
기능 : 회원 탈퇴를 요청하고, 성공하면 로컬 세션과 서버 상태 캐시를 정리한 뒤 로그인 화면으로 보낸다.
인자 : 없음
반환값 : 탈퇴 핸들러, 진행 상태, 실패 여부와 실패 상태 초기화 함수
*/
export function useWithdraw() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending, isError, reset } = useWithdrawMutation();

  const withdraw = useCallback(async (): Promise<void> => {
    if (isPending) {
      return;
    }

    /*
    로그아웃과 달리 실패하면 로컬 세션을 정리하지 않는다.
    로그인 화면으로 보내면 사용자는 탈퇴된 줄 알지만 계정과 데이터는 남아 있다.
    실패는 isError로 화면에 알리고, 서버가 재요청을 성공으로 처리하므로 다시 시도하게 한다.
    */
    try {
      await mutateAsync();
    } catch (error) {
      console.error("Failed to withdraw", error);
      return;
    }

    /*
    정리 순서는 useLogout과 같다.
    서버가 쿠키를 이미 지웠지만, 기록해 두면 clearSession 알림을 받은 화면이 복구 요청을 보내지 않는다.
    */
    markSessionEnded();
    authSession.clearSession();
    router.replace(routes.login);

    /*
    탈퇴한 회원의 데이터가 다음 로그인 이후까지 남지 않도록 캐시를 비운다.
    세션 정리와 화면 이동이 끝난 뒤에 비워야 아직 붙어 있는 query가 다시 조회하지 않는다.
    */
    queryClient.clear();
  }, [isPending, mutateAsync, queryClient, router]);

  return {
    withdraw,
    isWithdrawing: isPending,
    isWithdrawFailed: isError,
    resetWithdrawState: reset,
  };
}
