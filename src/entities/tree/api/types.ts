import { ApiResponse } from "@/src/shared/api/types";

/*
트리 내부 노드 DTO type
*/
export interface NodeDTO {
  nodeId: number;
  name: string;
  parentId: number | null;
  orderId: number;
  memo: string | null;
}

/*
트리 DTO type
*/
export interface TreeDTO {
  treeId: number;
  nodes: NodeDTO[];
}

/*
트리 생성 응답 type
*/
export type CreateTreeResponse = ApiResponse<TreeDTO>;

/*
트리 조회 응답 type
*/
export type GetTreeResponse = ApiResponse<{ nodes: NodeDTO[] }>;

/*
트리 노드 추가 요청 body type
*/
export interface CreateNodeRequest {
  name: string;
  parentId: number;
  orderId: number;
}

/*
트리 노드 추가 응답 type
*/
export type CreateNodeResponse = ApiResponse<NodeDTO>;
