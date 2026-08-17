import type { ApiResponse } from "@/src/shared/api/types";

export interface GoogleLoginRequest {
  idToken: string;
}

export interface MemberDTO {
  memberId: number;
  email: string;
  name: string;
  profileImage: string;
}

export interface GoogleLoginData {
  accessToken: string;
  refreshToken: string;
  member: MemberDTO;
}

export type GoogleLoginResponse = ApiResponse<GoogleLoginData>;

export interface LogoutRequest {
  refreshToken: string;
}

export type LogoutResponse = ApiResponse<null>;
