const ACCESS_TOKEN_KEY = "twig-tree.access-token";
const AUTH_SESSION_CHANGE_EVENT = "twig-tree:auth-session-change";

export type AuthTokens = {
  accessToken: string; // 보호된 API 요청의 Authorization 헤더에 사용한다.
};

/*
 * refresh token은 HttpOnly 쿠키로만 오가므로 여기서 다루지 않는다.
 * access token은 Authorization 헤더에 실어야 해서 JS가 읽을 수 있어야 하고,
 * 수명이 짧아 sessionStorage로 탭 수명까지만 남긴다.
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

  hasAccessToken: (): boolean => {
    return authSession.getAccessToken() !== null;
  },

  setTokens: ({ accessToken }: AuthTokens): void => {
    getSessionStorage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
    notifyAuthSessionChange();
  },

  /*
  refresh token 쿠키는 JS가 지울 수 없으므로 서버의 로그아웃 응답이 만료시킨다.
  여기서는 화면이 들고 있는 access token만 정리한다.
  */
  clearSession: (): void => {
    getSessionStorage()?.removeItem(ACCESS_TOKEN_KEY);
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
