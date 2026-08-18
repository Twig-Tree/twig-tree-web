import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type {
  GoogleLoginRequest,
  GoogleLoginData,
  GoogleLoginResponse,
  LogoutRequest,
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
  서버는 알아볼 수 없는 토큰에도 성공으로 응답한다. 폐기할 대상이 없다는 뜻이므로 오류가 아니다.
  */
  logout: async (refreshToken: string): Promise<void> => {
    const body: LogoutRequest = { refreshToken };
    await axiosInstance.post<LogoutResponse>("/auth/logout", body);
  },
};
