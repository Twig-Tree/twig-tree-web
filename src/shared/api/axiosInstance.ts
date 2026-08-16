import axios from "axios";
import { apiBaseUrl } from "@/src/shared/config/api";
import { isAuthRequired } from "@/src/shared/config/auth";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "@/src/shared/lib/auth/authSession";

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const isLoginRequest = (url: string | undefined): boolean => {
  return url === "/auth/google";
};

axiosInstance.interceptors.request.use((config) => {
  const accessToken = authSession.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  if (isAuthRequired && !isLoginRequest(config.url)) {
    return Promise.reject(
      new Error("인증이 필요한 요청이지만 access token이 없습니다."),
    );
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // todo: 액세스 토큰 재발급
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authSession.clearSession();

      if (
        isAuthRequired &&
        typeof window !== "undefined" &&
        window.location.pathname !== routes.login
      ) {
        window.location.replace(routes.login);
      }
    }

    return Promise.reject(error);
  },
);
