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
 * 최신순 워크스페이스 목록 한 페이지 DTO type
 * nextCursor는 마지막 페이지에서 null이다. Swagger 스키마에는 nullable 표시가 없지만 서버 코드가 null을 넣는다.
 */
export interface RecentWorkspaceSliceDTO {
  workspaces: WorkspaceDTO[];
  nextCursor: string | null; // 다음 페이지 요청에 그대로 돌려보낼 불투명 문자열
  hasNext: boolean;
}

/**
 * 최신순 워크스페이스 목록 조회 요청 query parameter type
 */
export interface GetRecentWorkspaceListParams {
  cursor: string | null; // 직전 응답의 nextCursor. 첫 페이지는 null
  size: number; // 한 페이지에 받을 개수. 서버가 1~50으로 보정한다
}

/**
 * 최신순 워크스페이스 목록 조회 응답 type
 * 폴더별 목록과 달리 커서 기반 페이지 래퍼로 온다.
 */
export type GetRecentWorkspaceListResponse =
  ApiResponse<RecentWorkspaceSliceDTO>;

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
 * 워크스페이스 삭제 응답 type
 * 본문에 데이터가 없다.
 */
export type DeleteWorkspaceResponse = ApiResponse<void>;

/**
 * 워크스페이스 트리 생성 응답 type
 * 서버는 노드 없는 빈 트리를 만들고 treeId만 돌려준다.
 */
export type CreateWorkspaceTreeResponse = ApiResponse<{ treeId: number }>;
