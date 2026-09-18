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
백엔드가 프롬프트 한 번으로 워크스페이스·트리·노드를 만들고 셋을 함께 돌려주므로 workspaceId도 담긴다.
*/
export interface TreeDTO {
  treeId: number;
  workspaceId: number;
  nodes: NodeDTO[];
}

/*
LLM 제공자 type. 백엔드 LlmProvider enum이 출처다.
*/
export type LlmProvider = "OPENAI" | "OLLAMA";

/*
프롬프트 트리 생성 요청 body type
provider를 생략하면 백엔드가 맞는 클라이언트를 찾지 못해 CHAT400-1로 거절하므로 선택 항목이 아니다.
*/
export interface CreateTreeFromPromptRequest {
  message: string;
  provider: LlmProvider;
}

/*
LLM을 호출하지 않고 고정 트리를 받는 개발용 시나리오 type.
백엔드 ChatController의 mock 파라미터 허용값이며, 브라우저에서 LLM 키 없이 화면을 확인할 때만 쓴다.
*/
export type TreeMockScenario = "empty" | "small" | "large" | "max";

/*
프롬프트 트리 생성 응답 type
*/
export type CreateTreeFromPromptResponse = ApiResponse<TreeDTO>;

/*
트리 조회 응답 type
*/
export type GetTreeResponse = ApiResponse<{ nodes: NodeDTO[] }>;

/*
트리 노드 추가 요청 body type
*/
export interface CreateNodeRequest {
  name: string;
  parentId: number | null; // 루트 노드는 null. 트리당 루트는 하나라 이미 있으면 서버가 409로 거절한다
  orderId: number;
}

/*
트리 노드 추가 응답 type
*/
export type CreateNodeResponse = ApiResponse<NodeDTO>;

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
