import { axiosInstance } from "@/src/shared/api/axiosInstance";
import type {
  GoogleLoginRequest,
  GoogleLoginResponse,
  MemberDTO,
} from "./types";

export const authApi = {
  googleLogin: async (idToken: string): Promise<MemberDTO> => {
    const body: GoogleLoginRequest = { idToken };
    const response = await axiosInstance.post<GoogleLoginResponse>(
      "/auth/google",
      body,
    );
    return response.data.data.member;
  },
};
