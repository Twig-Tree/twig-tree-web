import type { LlmProvider } from "../api/types";

/*
노드 이름과 메모 내용의 길이 상한. 백엔드가 초과 시 400을 반환하는 계약값이므로 entity가 소유한다.
글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 JavaScript의 String.length와 같은 단위다.

메모가 트리와 같은 슬라이스에 있는 이유는 fsd-layers.md의 "한 응답을 여러 도메인이 나눠 쓸 때"를 따른다.
*/
export const MAX_NODE_NAME_LENGTH = 30;

export const MAX_MEMO_LENGTH = 500;

/*
노드 요청에서 분기에 필요한 백엔드 에러 코드. 백엔드 NodeErrorCode.java가 출처다.
ONE_ROOT_PER_TREE는 서비스 코드가 아니라 DB 유니크 인덱스 uk_nodes_root_per_tree 위반을 옮긴 코드다.
*/
export const NODE_ERROR_CODE = {
  ONE_ROOT_PER_TREE: "NODE409-2",
} as const;

/*
트리 생성에 사용할 LLM 제공자. 백엔드가 provider 없는 요청을 CHAT400-1로 거절하므로 항상 실어 보낸다.
사용자가 제공자를 고르는 화면이 아직 없어 프론트가 하나로 고정한다.
*/
export const LLM_PROVIDER: LlmProvider = "OPENAI";

/*
프롬프트 트리 생성 요청의 지시문 길이 상한. 백엔드 ChatReqDTO.MESSAGE_MAX_LENGTH가 출처다.
*/
export const MAX_PROMPT_MESSAGE_LENGTH = 500;
