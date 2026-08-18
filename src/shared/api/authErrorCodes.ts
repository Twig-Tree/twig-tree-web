import axios from "axios";

/*
 * 백엔드 인증 에러 코드. Swagger에는 문서화돼 있지 않아 아래 enum 소스가 유일한 출처다.
 *   global/apiPayload/code/GeneralErrorCode.java
 *   domain/auth/exception/code/AuthErrorCode.java
 *
 * 인증 흐름에서 올라올 수 있는 코드는 다음과 같다. 이 중 분기에 필요한 둘만 상수로 둔다.
 *   AUTH401-1   구글 ID 토큰 무효 (로그인 화면에서 처리)
 *   AUTH401-2   access token 만료          → 재발급
 *   AUTH401-3   access token 위조·손상
 *   AUTH401-4   refresh token 무효·재사용 탐지
 *   AUTH401-5   refresh token 만료
 *   AUTH503-1   토큰 저장소(Redis) 장애    → 세션 유지
 *   COMMON400-1 요청 본문 검증 실패
 *   COMMON401-1 Authorization 헤더 없음
 */
export const AUTH_ERROR_CODE = {
  EXPIRED_ACCESS_TOKEN: "AUTH401-2",
  TOKEN_STORE_UNAVAILABLE: "AUTH503-1",
} as const;

/*
 * 401을 받고도 세션을 끝내면 안 되는 코드들.
 * 저장소 장애를 재로그인으로 처리하면 서버가 잠깐 흔들릴 때 전 사용자가 로그인 화면으로 튕긴다.
 */
const SESSION_PRESERVED_CODES: readonly string[] = [
  AUTH_ERROR_CODE.EXPIRED_ACCESS_TOKEN,
  AUTH_ERROR_CODE.TOKEN_STORE_UNAVAILABLE,
];

/*
함수 이름 : getApiErrorCode
기능 : 백엔드 에러 응답 봉투에서 에러 코드를 꺼낸다. 성공과 실패가 같은 봉투를 쓰므로 401 응답에도 code가 들어 있다.
인자 : unknown error -> axios가 reject한 오류 객체
반환값 : 에러 코드 문자열. axios 오류가 아니거나 응답 본문에 code가 없으면 null
*/
export const getApiErrorCode = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data: unknown = error.response?.data;

  if (typeof data !== "object" || data === null) {
    return null;
  }

  const code: unknown = (data as { code?: unknown }).code;

  return typeof code === "string" ? code : null;
};

/*
함수 이름 : isReissuableError
기능 : access token 재발급으로 복구할 수 있는 오류인지 판정한다.
인자 : unknown error -> axios가 reject한 오류 객체
반환값 : 재발급을 시도해야 하면 true
*/
export const isReissuableError = (error: unknown): boolean => {
  return getApiErrorCode(error) === AUTH_ERROR_CODE.EXPIRED_ACCESS_TOKEN;
};

/*
함수 이름 : isSessionEndingError
기능 : 세션을 정리하고 로그인 화면으로 보내야 하는 오류인지 판정한다.
      코드를 열거하지 않고 401 중 복구 가능한 것만 제외하므로, 백엔드에 인증 에러가 추가돼도 안전한 쪽으로 처리된다.
인자 : unknown error -> axios가 reject한 오류 객체
반환값 : 세션을 종료해야 하면 true
*/
export const isSessionEndingError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) {
    return false;
  }

  const code = getApiErrorCode(error);

  return code === null || !SESSION_PRESERVED_CODES.includes(code);
};
