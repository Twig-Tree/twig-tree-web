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
  version: number; // 이름·메모를 수정할 때마다 서버가 1씩 올리는 값. 이동과 태그 변경으로는 오르지 않는다
  tagIds: number[]; // 노드에 붙은 트리 태그 ID 목록
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
  version: number; // 화면이 알고 있는 노드 version. 서버 값과 다르면 409로 거절된다
}

/*
노드 제목 수정 응답 type
서버는 수정된 노드 전체를 반환하므로 트리 조회 응답과 같은 NodeDTO를 사용한다.
*/
export type EditNodeNameResponse = ApiResponse<NodeDTO>;

/*
노드 이동 요청 body type
같은 부모 안에서 순서만 바꿀 때도 parentId를 싣는다. 루트로는 옮길 수 없어 null이 없다.
*/
export interface MoveNodeRequest {
  parentId: number; // 목적지 부모 노드 ID
  position: number; // 목적지 부모 밑에서의 순번. 1부터 센다
}

/*
노드 이동 결과 DTO type
이동으로 형제들의 orderId가 함께 다시 매겨지므로, 서버가 영향받은 형제 목록을 orderId 오름차순으로 돌려준다.
같은 부모 안 이동이면 previousParentId는 null, previousSiblings는 빈 배열이다.
*/
export interface MoveNodeResultDTO {
  parentId: number;
  siblings: NodeDTO[]; // 목적지 부모의 자식 전체. 옮긴 노드도 새 parentId로 들어 있다
  previousParentId: number | null;
  previousSiblings: NodeDTO[]; // 다른 부모로 옮겼을 때 원래 부모에 남은 자식 전체
}

/*
노드 이동 응답 type
*/
export type MoveNodeResponse = ApiResponse<MoveNodeResultDTO>;

/*
메모 응답 DTO type
*/
export interface MemoDTO {
  title: string;
  content: string | null;
  version: number; // 저장 후 노드의 version
}

/*
메모 생성/수정 요청 body type
*/
export interface UpdateMemoRequest {
  content: string;
  version: number; // 화면이 알고 있는 노드 version. 서버 값과 다르면 409로 거절된다
}

/*
메모 생성/수정 응답 type
*/
export type UpdateMemoResponse = ApiResponse<MemoDTO>;

/*
트리 태그 DTO type
트리 태그 생성·목록 조회와 노드 태그 추가가 같은 모양으로 돌려준다.
*/
export interface TagDTO {
  tagId: number;
  name: string;
}

/*
트리 태그 생성 요청 body type
*/
export interface CreateTagRequest {
  name: string;
}

/*
트리 태그 생성 응답 type
*/
export type CreateTagResponse = ApiResponse<TagDTO>;

/*
트리 태그 목록 조회 응답 type
*/
export type GetTreeTagsResponse = ApiResponse<TagDTO[]>;

/*
노드 태그 추가 응답 type
서버는 노드에 붙인 트리 태그를 돌려준다.
*/
export type AddNodeTagResponse = ApiResponse<TagDTO>;
