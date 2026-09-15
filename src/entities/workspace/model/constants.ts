/*
워크스페이스 트리 생성 요청에서 분기에 필요한 백엔드 에러 코드. 백엔드 TreeErrorCode.java가 출처다.
워크스페이스당 트리는 하나라, 이미 있으면 409와 함께 이 코드가 오고 응답에 기존 treeId는 없다.
*/
export const TREE_ERROR_CODE = {
  TREE_ALREADY_EXISTS: "TREE409-1",
} as const;
