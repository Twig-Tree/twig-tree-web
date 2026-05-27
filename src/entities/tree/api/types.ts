import { ApiResponse } from "@/src/shared/api/types";

/*
트리 내부 노드 DTO type
*/
export interface NodeDTO {
  node_id: number;
  title: string;
  parent_id: number | null;
  order_id: number;
  memo: string | null;
}

/*
트리 조회 응답 type
*/
export type TreeResponse = ApiResponse<{
  treeName: string;
  nodes: NodeDTO[];
}>;

/*
트리 노드 추가 요청 body type
*/
export interface CreateNodeRequest {
  title: string;
  parent_id: number;
  order_id: number;
}
