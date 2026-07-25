import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type {
  GoogleLoginRequest,
  GoogleLoginData,
  GoogleLoginResponse,
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
};
