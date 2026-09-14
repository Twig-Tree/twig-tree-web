import { createSingleFlight } from "@/src/shared/lib/async/createSingleFlight";
import { runWithCrossTabLock } from "@/src/shared/lib/async/runWithCrossTabLock";
import {
  authSession,
  type AuthTokens,
} from "@/src/shared/lib/auth/authSession";
import { requestReissue } from "./reissueClient";

// 같은 origin의 모든 탭이 재발급 순서를 맞추는 데 쓰는 락 이름
const REISSUE_LOCK_NAME = "twig-tree:reissue";

/*
함수 이름 : reissueSession
기능 : 쿠키의 refresh token으로 access token을 재발급받아 저장한다. 탭 안에서는 동시 호출을 한 번의 요청으로 묶고, 탭 사이에서는 요청을 순서대로 보낸다.
인자 : 없음
반환값 : 새로 발급된 access token
*/
export const reissueSession = createSingleFlight(
  async (): Promise<AuthTokens> => {
    /*
    서버는 재발급마다 refresh token을 회전시키므로, 회전 전 쿠키로 두 번 요청하면 두 번째가
    이미 폐기된 토큰을 사용한 것이 되어 탈취로 판정되고 해당 회원의 모든 세션이 끊긴다.

    탭 안의 동시 호출은 createSingleFlight가 요청 한 번으로 묶는다.
    쿠키는 모든 탭이 공유하므로 탭 사이는 락으로 순서를 맞춘다. 락을 기다린 탭은 재발급을 그대로
    보내는데, 그 사이 앞선 탭의 응답으로 쿠키가 이미 회전돼 있어 새 쿠키로 요청하게 된다.
    */
    const tokens = await runWithCrossTabLock(REISSUE_LOCK_NAME, requestReissue);
    authSession.setTokens(tokens);

    return tokens;
  },
);
