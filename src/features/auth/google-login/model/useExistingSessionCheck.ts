"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreSession } from "@/src/shared/api/restoreSession";
import { routes } from "@/src/shared/config/routes";

/*
checking        : 기존 세션을 확인하는 중이거나, 복구에 성공해 대시보드로 이동하는 중이다.
unauthenticated : 복구할 세션이 없다.
failed          : 서버가 세션 여부를 답하지 못했다.
*/
export type ExistingSessionCheckStatus =
  | "checking"
  | "unauthenticated"
  | "failed";

/*
함수 이름 : useExistingSessionCheck
기능 : 로그인 화면에 들어오면 refresh token 쿠키로 기존 세션을 확인하고, 세션이 있으면 대시보드로 보낸다.
인자 : 없음
반환값 : 기존 세션 확인 상태
*/
export function useExistingSessionCheck(): ExistingSessionCheckStatus {
  const router = useRouter();
  const [status, setStatus] = useState<ExistingSessionCheckStatus>("checking");

  /*
  AuthGate가 이미 세션이 없다고 확인한 뒤 보냈다면 restoreSession이 요청 없이 곧바로 답한다.
  AuthGate에서 failed였다면 여기서 한 번 더 복구를 시도한다.

  restored면 상태를 바꾸지 않는다. 이동하는 동안 로그인 버튼이 잠깐 보이지 않게 하려는 것이다.
  */
  useEffect(() => {
    let isCancelled = false; // 확인 중 언마운트되면 늦게 도착한 결과로 이동하거나 상태를 바꾸지 않는다.

    void restoreSession().then((result) => {
      if (isCancelled) {
        return;
      }

      if (result === "restored") {
        router.replace(routes.dashboard);
        return;
      }

      setStatus(result);
    });

    return () => {
      isCancelled = true;
    };
  }, [router]);

  return status;
}
