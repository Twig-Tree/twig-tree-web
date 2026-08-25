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

/*
refresh token은 응답 본문이 아니라 Set-Cookie로 내려오므로 DTO에 없다.
*/
export interface GoogleLoginData {
  accessToken: string;
  member: MemberDTO;
}

export type GoogleLoginResponse = ApiResponse<GoogleLoginData>;

export type LogoutResponse = ApiResponse<null>;
