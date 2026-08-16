import axios, { type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl } from "@/src/shared/config/api";
import { isAuthRequired } from "@/src/shared/config/auth";
import { routes } from "@/src/shared/config/routes";
import {
  authSession,
  type AuthTokens,
} from "@/src/shared/lib/auth/authSession";
import { isReissuableError, isSessionEndingError } from "./authErrorCodes";
import { requestReissue } from "./reissueClient";

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 백엔드가 인증 없이 허용하는 경로. 재발급과 로그아웃은 refresh token을 본문으로 보낸다.
const AUTH_PUBLIC_PATHS = ["/auth/google", "/auth/refresh", "/auth/logout"];

const isAuthPublicRequest = (url: string | undefined): boolean => {
  return url !== undefined && AUTH_PUBLIC_PATHS.includes(url);
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  isRetriedAfterReissue?: boolean; // 재발급 후 이미 한 번 재시도한 요청인지 표시한다.
};

axiosInstance.interceptors.request.use((config) => {
  const accessToken = authSession.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  if (isAuthRequired && !isAuthPublicRequest(config.url)) {
    return Promise.reject(
      new Error("인증이 필요한 요청이지만 access token이 없습니다."),
    );
  }

  return config;
});

/*
진행 중인 재발급 요청. 여러 요청이 동시에 만료를 받아도 재발급은 한 번만 보낸다.
서버는 재발급마다 refresh token을 회전시키므로, 두 번 보내면 두 번째가 이미 폐기된
토큰을 사용한 것이 되어 탈취로 판정되고 해당 회원의 모든 세션이 끊긴다.
*/
let reissuePromise: Promise<AuthTokens> | null = null;

/*
함수 이름 : reissueOnce
기능 : 재발급 요청이 진행 중이면 그 결과를 함께 기다리고, 없으면 새로 보낸다. 성공하면 새 토큰쌍을 저장한다.
인자 : string refreshToken -> 재발급에 사용할 refresh token. 동시 호출자는 같은 값을 넘기므로 먼저 시작한 요청의 값이 쓰인다.
반환값 : 새로 발급된 토큰쌍
*/
const reissueOnce = (refreshToken: string): Promise<AuthTokens> => {
  reissuePromise ??= requestReissue(refreshToken)
    .then((tokens) => {
      authSession.setTokens(tokens);
      return tokens;
    })
    .finally(() => {
      reissuePromise = null;
    });

  return reissuePromise;
};

/*
함수 이름 : endSession
기능 : 보관 중인 토큰을 지우고 로그인 화면으로 보낸다.
인자 : 없음
반환값 : 없음
*/
const endSession = (): void => {
  authSession.clearSession();

  if (
    isAuthRequired &&
    typeof window !== "undefined" &&
    window.location.pathname !== routes.login
  ) {
    window.location.replace(routes.login);
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    /*
    access token 만료만 재발급으로 복구한다.
    재발급 후 재시도한 요청이 다시 만료를 받거나 refresh token이 없으면 복구할 방법이 없다.
    */
    if (isReissuableError(error)) {
      const config = axios.isAxiosError(error)
        ? (error.config as RetriableRequestConfig | undefined)
        : undefined;
      const refreshToken = authSession.getRefreshToken();

      if (!config || config.isRetriedAfterReissue || !refreshToken) {
        endSession();
        return Promise.reject(error);
      }

      try {
        await reissueOnce(refreshToken);
      } catch (reissueError) {
        /*
        저장소 장애와 네트워크 오류는 세션 문제가 아니므로 로그인 화면으로 보내지 않는다.
        재발급 실패 원인을 그대로 전달해야 호출자가 재시도 여부를 판단할 수 있다.
        */
        if (isSessionEndingError(reissueError)) {
          endSession();
        }

        return Promise.reject(reissueError);
      }

      /*
      axiosInstance(config)는 실패했던 요청을 같은 설정으로 다시 보낸다.
      reissueOnce가 새 토큰을 이미 저장했고 재시도 요청도 request 인터셉터를 다시 타므로
      Authorization 헤더는 여기서 손대지 않는다.
      */
      config.isRetriedAfterReissue = true;

      return axiosInstance(config);
    }

    if (isSessionEndingError(error)) {
      endSession();
    }

    return Promise.reject(error);
  },
);
