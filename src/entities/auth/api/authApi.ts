import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type {
  GoogleLoginRequest,
  GoogleLoginData,
  GoogleLoginResponse,
  LogoutResponse,
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
};
