import { ApiResponse } from "@/src/shared/api/types";
import { NodeDTO } from "@/src/entities/tree";

/*
노드 제목 수정 요청 body type
*/
export interface EditNodeNameRequest {
  name: string;
}

/*
노드 제목 수정 응답 type
서버는 수정된 노드 전체를 반환하므로 트리 조회 응답과 같은 NodeDTO를 사용한다.
*/
export type EditNodeNameResponse = ApiResponse<NodeDTO>;
