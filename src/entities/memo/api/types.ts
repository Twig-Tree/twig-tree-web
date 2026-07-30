import { ApiResponse } from "@/src/shared/api/types";

/*
메모 응답 DTO type
*/
export interface MemoDTO {
  title: string;
  content: string | null;
}

/*
메모 생성/수정 요청 body type
*/
export interface UpdateMemoRequest {
  content: string;
}

/*
메모 생성/수정 응답 type
*/
export type UpdateMemoResponse = ApiResponse<MemoDTO>;
