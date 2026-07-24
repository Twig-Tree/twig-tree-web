import { ApiResponse } from "@/src/shared/api/types";

/**
 * 폴더 생성 요청 body type
 */
export interface CreateFolderRequest {
  name: string;
  folderParentId: number | null;
}

/**
 * 폴더 수정 요청 body type
 */
export interface UpdateFolderRequest {
  name: string;
}

/**
 * 폴더 DTO type
 */
export interface FolderDTO {
  folderId: number;
  name: string;
  folderParentId: number | null;
}

/**
 * 폴더 생성 응답 type
 */
export type CreateFolderResponse = ApiResponse<FolderDTO>;

/**
 * 폴더 수정 응답 type
 */
export type UpdateFolderResponse = ApiResponse<FolderDTO>;

/**
 * 폴더 목록 조회 응답 type
 */
export type GetFolderListResponse = ApiResponse<FolderDTO[]>;
