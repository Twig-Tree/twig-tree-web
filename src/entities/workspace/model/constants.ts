/*
워크스페이스 이름 길이 상한. 백엔드가 초과 시 400을 반환하는 계약값이므로 entity가 소유한다.
글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 JavaScript의 String.length와 같은 단위다.
*/
export const MAX_WORKSPACE_NAME_LENGTH = 30;

/*
워크스페이스 트리 생성 요청에서 분기에 필요한 백엔드 에러 코드. 백엔드 TreeErrorCode.java가 출처다.
워크스페이스당 트리는 하나라, 이미 있으면 409와 함께 이 코드가 오고 응답에 기존 treeId는 없다.
*/
export const TREE_ERROR_CODE = {
  TREE_ALREADY_EXISTS: "TREE409-1",
} as const;
