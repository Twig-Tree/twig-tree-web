/*
폴더 이름 길이 상한. 백엔드가 초과 시 400을 반환하는 계약값이므로 entity가 소유한다.
글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 JavaScript의 String.length와 같은 단위다.

이 모듈은 슬라이스 공개 API로 내보내지 않는다. 이 슬라이스의 index를 거치면 api 모듈까지 함께
로드되어, 값 하나를 쓰는 쪽이 axios와 환경변수 검사까지 끌어오게 된다.
*/
export const MAX_FOLDER_NAME_LENGTH = 30;
