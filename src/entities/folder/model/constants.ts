/*
폴더 이름 길이 상한. 백엔드가 초과 시 400을 반환하는 계약값이므로 entity가 소유한다.
글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 JavaScript의 String.length와 같은 단위다.
*/
export const MAX_FOLDER_NAME_LENGTH = 30;
