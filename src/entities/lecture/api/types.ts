import { ApiResponse } from "@/src/shared/api/types";

/*
repair 요청 DTO type. 백엔드 LectureReqDTO.Repair가 출처다.
stage는 백엔드가 문자열로만 받으므로 프론트의 단계 이름을 그대로 싣는다.
*/
export interface LectureRepairDTO {
  attempt: number;
  previousResponseText: string;
  issues: {
    stage: string;
    path: string;
    message: string;
  }[];
  omittedIssueCount: number;
}

/*
강의 시나리오 생성 요청 body type. 백엔드 LectureReqDTO가 출처다.
provider는 생략하면 백엔드가 OPENAI를 쓰므로 싣지 않는다.
*/
export interface GenerateLectureScenarioRequest {
  treeId: number;
  request: string; // 사용자 요청 문장
  treeOutline: string; // 프론트가 만든 트리 outline
  scenarioSchemaVersion: number; // 서버의 버전과 다르면 400 LECTURE400-2
  repair: LectureRepairDTO | null; // 처음 요청이면 null
}

/*
강의 시나리오 생성 응답 DTO type. 백엔드 LectureGenResDTO가 출처다.
*/
export interface LectureGenerationResponseDTO {
  responseText: string; // 파싱하지 않은 모델 응답 원본
  model: string;
  promptVersion: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  }; // 백엔드가 재시도했다면 모든 호출의 합
  attemptCount: number; // 백엔드가 모델을 부른 횟수(재시도 포함)
}

export type GenerateLectureScenarioResponse =
  ApiResponse<LectureGenerationResponseDTO>;
