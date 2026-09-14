import axios from "axios";
import { apiBaseUrl } from "@/src/shared/config/api";
import type { AuthTokens } from "@/src/shared/lib/auth/authSession";
import type { ApiResponse } from "./types";

/*
 * 재발급 요청은 axiosInstance를 쓰지 않는다.
 * axiosInstance의 응답 인터셉터가 401을 받으면 재발급을 시도하는데,
 * 재발급 요청 자체가 401을 받으면 그 인터셉터를 다시 타서 재귀한다.
 */
const reissueAxios = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true, // 재발급은 쿠키의 refresh token으로 인증하므로 반드시 쿠키를 실어 보낸다.
  headers: {
    "Content-Type": "application/json",
  },
});

/*
함수 이름 : requestReissue
기능 : 쿠키의 refresh token으로 새 access token을 발급받는다. 서버는 member 정보도 함께 내려주지만 토큰 갱신에는 쓰지 않으므로 받지 않는다.
인자 : 없음
반환값 : 새로 발급된 access token
*/
export const requestReissue = async (): Promise<AuthTokens> => {
  /*
  refresh token은 쿠키로 오가므로 보낼 본문도, 저장할 응답 값도 없다.
  서버는 재발급마다 refresh token을 회전시키지만 회전 결과는 Set-Cookie로만 내려오고
  브라우저가 알아서 교체하므로 프론트가 관여하지 않는다.
  */
  const response =
    await reissueAxios.post<ApiResponse<AuthTokens>>("/auth/refresh");

  return response.data.data;
};
