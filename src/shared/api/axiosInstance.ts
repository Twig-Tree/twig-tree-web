import axios from "axios";
import { isAuthRequired } from "@/src/shared/config/auth";
import { authSession } from "@/src/shared/lib/auth/authSession";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

/*
API 서버 주소 환경변수가 설정되지 않은 경우 잘못된 주소로 요청되는 것을 방지한다.
*/
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.");
}

export const axiosInstance = axios.create({
  baseURL,
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
