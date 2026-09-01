import { ApiResponse } from "@/src/shared/api/types";

/**
 * 워크스페이스 DTO type
 */
export interface WorkspaceDTO {
  workspaceId: number;
  name: string;
  folderId: number | null;
  updatedAt: string;
}

/**
 * 워크스페이스 목록 조회 응답 type
 */
export type GetWorkspaceListResponse = ApiResponse<WorkspaceDTO[]>;
