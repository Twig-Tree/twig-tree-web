import { ApiResponse } from "@/src/shared/api/types";

/**
 * 폴더 생성 요청 body type
 */
export interface CreateFolderRequest {
  name: string;
  folderParentId: number;
}

/**
 * 폴더 DTO type
 */
export interface FolderDTO {
  folderId: number;
  name: string;
  folderParentId: number;
}

/**
 * 폴더 생성 응답 type
 */
export type CreateFolderResponse = ApiResponse<FolderDTO>;
