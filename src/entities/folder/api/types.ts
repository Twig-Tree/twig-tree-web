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
 * 폴더 이동 요청 body type
 */
export interface MoveFolderRequest {
  folderParentId: number | null; // 옮겨 갈 부모 폴더 ID. 루트는 null
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
 * 폴더 상위 경로 항목 DTO type
 */
export interface FolderPathItemDTO {
  folderId: number;
  name: string;
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
 * 폴더 이동 응답 type
 */
export type MoveFolderResponse = ApiResponse<FolderDTO>;

/**
 * 폴더 삭제 응답 type
 */
export type DeleteFolderResponse = ApiResponse<void>;

/**
 * 폴더 조회 응답 type
 */
export type GetFolderResponse = ApiResponse<FolderDTO>;

/**
 * 폴더 목록 조회 응답 type
 */
export type GetFolderListResponse = ApiResponse<FolderDTO[]>;

/**
 * 폴더 상위 경로 조회 응답 type
 */
export type GetFolderPathResponse = ApiResponse<{
  path: FolderPathItemDTO[];
}>;
