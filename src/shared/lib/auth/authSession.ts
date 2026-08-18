const ACCESS_TOKEN_KEY = "twig-tree.access-token";
const REFRESH_TOKEN_KEY = "twig-tree.refresh-token";
const AUTH_SESSION_CHANGE_EVENT = "twig-tree:auth-session-change";

export type AuthTokens = {
  accessToken: string; // 보호된 API 요청의 Authorization 헤더에 사용한다.
  refreshToken: string; // access token 만료 시 재발급 요청에 사용한다.
};

/*
 * refresh token은 수명이 14일이라 localStorage에 두면 XSS 노출 구간이 그만큼 길어진다.
 * sessionStorage로 제한해 탭 수명까지만 남긴다.
 * 백엔드가 refresh token을 HttpOnly 쿠키로 내려주면(BE #42) 이 저장 로직은 삭제한다.
 */
const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

// 토큰 상태가 변경됐음을 authSession 구독자에게 알린다.
const notifyAuthSessionChange = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
  }
};

export const authSession = {
  getAccessToken: (): string | null => {
    return getSessionStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  },

  getRefreshToken: (): string | null => {
    return getSessionStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  },

  hasAccessToken: (): boolean => {
    return authSession.getAccessToken() !== null;
  },

  setTokens: ({ accessToken, refreshToken }: AuthTokens): void => {
    const sessionStorage = getSessionStorage();

    sessionStorage?.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage?.setItem(REFRESH_TOKEN_KEY, refreshToken);
    notifyAuthSessionChange();
  },

  clearSession: (): void => {
    const sessionStorage = getSessionStorage();

    sessionStorage?.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage?.removeItem(REFRESH_TOKEN_KEY);
    notifyAuthSessionChange();
  },

  /*
   * React가 토큰 상태 변경을 감지할 수 있도록 변경 알림 함수를 구독한다.
   * 현재 문서의 변경은 커스텀 이벤트로, 다른 문서 컨텍스트의 변경은 storage 이벤트로 받는다.
   * 반환 함수는 컴포넌트가 구독을 해제할 때 등록한 이벤트 리스너를 제거한다.
   */
  subscribe: (onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  },
};
