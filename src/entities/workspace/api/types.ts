import { ApiResponse } from "@/src/shared/api/types";

/**
 * 워크스페이스 DTO type
 */
export interface WorkspaceDTO {
  workspaceId: number;
  name: string;
  folderId: number | null;
  treeId: number | null; // 트리가 없는 워크스페이스는 null
  updatedAt: string;
}

/**
 * 워크스페이스 생성 요청 body type
 */
export interface CreateWorkspaceRequest {
  name: string;
  folderId: number | null;
}

/**
 * 워크스페이스 이름 수정 요청 body type
 */
export interface UpdateWorkspaceRequest {
  name: string;
}

/**
 * 워크스페이스 목록 조회 응답 type
 */
export type GetWorkspaceListResponse = ApiResponse<WorkspaceDTO[]>;

/**
 * 워크스페이스 상세 조회 응답 type
 */
export type GetWorkspaceResponse = ApiResponse<WorkspaceDTO>;

/**
 * 워크스페이스 생성 응답 type
 */
export type CreateWorkspaceResponse = ApiResponse<WorkspaceDTO>;

/**
 * 워크스페이스 이름 수정 응답 type
 * 조회와 같은 DTO라 treeId까지 모두 담겨 온다.
 */
export type UpdateWorkspaceResponse = ApiResponse<WorkspaceDTO>;

/**
 * 워크스페이스 트리 생성 응답 type
 * 서버는 노드 없는 빈 트리를 만들고 treeId만 돌려준다.
 */
export type CreateWorkspaceTreeResponse = ApiResponse<{ treeId: number }>;
