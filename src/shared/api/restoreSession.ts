import { authSession } from "@/src/shared/lib/auth/authSession";
import { isSessionEndingError } from "./authErrorCodes";
import { reissueSession } from "./reissueSession";

/*
restored        : 세션이 있다. 이미 access token이 있거나 재발급에 성공했다.
unauthenticated : 서버가 복구할 세션이 없다고 확인했다. refresh token 쿠키가 없거나 무효·만료다.
failed          : 서버가 세션 여부를 답하지 못했다. 네트워크 오류, timeout, 토큰 저장소 장애 등이다.
*/
export type RestoreSessionResult = "restored" | "unauthenticated" | "failed";

/*
서버가 세션이 없다고 확인한 결과를 이 탭의 메모리에 남긴다.
AuthGate가 확인한 뒤 로그인 페이지로 보내면, 로그인 페이지가 같은 재발급을 다시 보내지 않게 한다.
새로고침하면 사라지므로 다른 탭에서 로그인한 경우도 새로고침으로 반영된다.
failed는 일시적인 오류라 남기지 않고 다음 호출에서 다시 묻는다.
*/
let isNoSessionConfirmed = false;

/*
함수 이름 : markSessionEnded
기능 : 사용자가 이 탭에서 세션을 끝냈음을 기록해, 새로고침 전까지 restoreSession이 복구를 시도하지 않게 한다.
인자 : 없음
반환값 : 없음
*/
export const markSessionEnded = (): void => {
  /*
  로그아웃은 서버의 refresh token 폐기에 실패해도 로컬 정리를 계속한다.
  이때 쿠키는 서버에서 아직 유효하므로, 기록하지 않으면 로그인 화면이 세션을 복구해 로그아웃이 되돌려진다.
  쿠키는 HttpOnly라 JS가 지울 수 없어서 새 탭이나 새로고침까지는 막지 못한다.
  */
  isNoSessionConfirmed = true;
};

/*
함수 이름 : restoreSession
기능 : access token이 없는 탭에서 refresh token 쿠키로 세션을 복구한다. 로그인 화면으로 보낼지는 결과를 받은 화면이 정한다.
인자 : 없음
반환값 : 세션 복구 결과
*/
export const restoreSession = async (): Promise<RestoreSessionResult> => {
  if (authSession.hasAccessToken()) {
    return "restored";
  }

  if (isNoSessionConfirmed) {
    return "unauthenticated";
  }

  /*
  StrictMode의 effect 이중 실행이나 여러 화면의 동시 호출은 reissueSession의 single-flight가
  요청 한 번으로 묶으므로 여기서 다시 묶지 않는다. 호출자마다 같은 결과를 받아 각자 분류한다.
  */
  try {
    await reissueSession();
    return "restored";
  } catch (error) {
    if (isSessionEndingError(error)) {
      isNoSessionConfirmed = true;
      return "unauthenticated";
    }

    return "failed";
  }
};
