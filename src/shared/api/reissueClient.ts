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
  headers: {
    "Content-Type": "application/json",
  },
});

interface ReissueRequest {
  refreshToken: string;
}

/*
함수 이름 : requestReissue
기능 : refresh token으로 새 토큰쌍을 발급받는다. 서버는 member 정보도 함께 내려주지만 토큰 갱신에는 쓰지 않으므로 받지 않는다.
인자 : string refreshToken -> 현재 보관 중인 refresh token
반환값 : 새로 발급된 access token과 refresh token
*/
export const requestReissue = async (
  refreshToken: string,
): Promise<AuthTokens> => {
  const body: ReissueRequest = { refreshToken };

  /*
  서버는 재발급마다 refresh token을 회전시키므로 응답의 refreshToken도 반드시 저장해야 한다.
  옛 refresh token을 다시 보내면 서버가 탈취로 판정해 해당 회원의 모든 세션을 끊는다.
  */
  const response = await reissueAxios.post<ApiResponse<AuthTokens>>(
    "/auth/refresh",
    body,
  );

  return response.data.data;
};
