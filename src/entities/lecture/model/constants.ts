/*
강의 생성 요청의 길이 상한. 백엔드 LectureReqDTO의 REQUEST_MAX_LENGTH, TREE_OUTLINE_MAX_LENGTH가 출처다.
넘기면 백엔드가 400을 반환한다. 글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 String.length와 같은 단위다.
*/
export const MAX_LECTURE_REQUEST_LENGTH = 500;

export const MAX_LECTURE_TREE_OUTLINE_LENGTH = 20_000;

/*
강의 생성 요청에서 분기에 필요한 백엔드 에러 코드. 백엔드 LectureErrorCode.java가 출처다.
502와 504는 백엔드가 한 번 다시 부른 뒤에도 실패한 경우다.
*/
export const LECTURE_ERROR_CODE = {
  UNSUPPORTED_PROVIDER: "LECTURE400-1",
  SCHEMA_VERSION_MISMATCH: "LECTURE400-2", // 프론트가 배포된 백엔드보다 새 스키마를 쓴다
  REPAIR_NOT_ALLOWED: "LECTURE400-3",
  LLM_CALL_FAILED: "LECTURE500-1",
  RESPONSE_TRUNCATED: "LECTURE502-1", // 출력 토큰 상한에 걸렸다. 요청 범위를 좁혀야 한다
  MODEL_REFUSED: "LECTURE502-2",
  RESPONSE_EMPTY: "LECTURE502-3",
  LLM_TIMEOUT: "LECTURE504-1",
} as const;
