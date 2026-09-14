import axios, { type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl } from "@/src/shared/config/api";
import { isAuthRequired } from "@/src/shared/config/auth";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { isReissuableError, isSessionEndingError } from "./authErrorCodes";
import { reissueSession } from "./reissueSession";

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true, // refresh token이 HttpOnly 쿠키로 오가므로 크로스 오리진 요청에도 쿠키를 싣는다.
  headers: {
    "Content-Type": "application/json",
  },
});

// 백엔드가 access token 없이 허용하는 경로. 재발급과 로그아웃은 쿠키의 refresh token으로 인증한다.
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
    재발급 후 재시도한 요청이 다시 만료를 받으면 복구할 방법이 없다.

    refresh token이 있는지는 미리 확인할 수 없다. HttpOnly 쿠키라 JS가 읽지 못하므로
    일단 재발급을 보내고, 쿠키가 없거나 만료였다면 서버가 내려주는 401을 아래에서 받는다.
    */
    if (isReissuableError(error)) {
      const config = axios.isAxiosError(error)
        ? (error.config as RetriableRequestConfig | undefined)
        : undefined;

      if (!config || config.isRetriedAfterReissue) {
        endSession();
        return Promise.reject(error);
      }

      try {
        await reissueSession();
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
      reissueSession이 새 토큰을 이미 저장했고 재시도 요청도 request 인터셉터를 다시 타므로
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
