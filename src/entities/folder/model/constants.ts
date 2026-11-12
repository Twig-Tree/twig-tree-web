/*
폴더 이름 길이 상한. 백엔드가 초과 시 400을 반환하는 계약값이므로 entity가 소유한다.
글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 JavaScript의 String.length와 같은 단위다.
*/
export const MAX_FOLDER_NAME_LENGTH = 30;

/*
폴더 요청에서 분기에 필요한 백엔드 에러 코드. 백엔드 FolderErrorCode.java가 출처다.
워크스페이스를 없는 폴더로 옮길 때도 FOLDER_NOT_FOUND가 온다.
*/
export const FOLDER_ERROR_CODE = {
  FOLDER_NOT_FOUND: "FOLDER404-1",
  PARENT_NOT_FOUND: "FOLDER404-2",
  DUPLICATE_FOLDER_NAME: "FOLDER400-2",
  INVALID_MOVE_TARGET: "FOLDER400-3", // 자기 자신이나 하위 폴더 밑으로 옮기려 했다
} as const;
