import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type {
  GoogleLoginRequest,
  GoogleLoginData,
  GoogleLoginResponse,
  LogoutResponse,
  WithdrawResponse,
} from "./types";

export const authApi = {
  googleLogin: async (idToken: string): Promise<GoogleLoginData> => {
    const body: GoogleLoginRequest = { idToken };
    const response = await axiosInstance.post<GoogleLoginResponse>(
      "/auth/google",
      body,
    );
    return response.data.data;
  },

  /*
  폐기할 refresh token은 쿠키로 전달되므로 본문이 없다.
  서버는 알아볼 수 없는 토큰에도 성공으로 응답한다. 폐기할 대상이 없다는 뜻이므로 오류가 아니다.
  */
  logout: async (): Promise<void> => {
    await axiosInstance.post<LogoutResponse>("/auth/logout");
  },

  /*
  로그인한 회원과 그 회원의 폴더·워크스페이스·트리를 즉시 삭제한다. 삭제한 데이터는 복구할 수 없다.
  서버가 모든 refresh token을 폐기하고 응답에서 쿠키를 지운다.
  이미 탈퇴한 회원이 다시 요청해도 성공으로 응답하므로, 응답을 받지 못했을 때 다시 요청해도 안전하다.
  */
  withdraw: async (): Promise<void> => {
    await axiosInstance.delete<WithdrawResponse>("/members/me");
  },
};
