/*
노드 이름과 메모 내용의 길이 상한. 백엔드가 초과 시 400을 반환하는 계약값이므로 entity가 소유한다.
글자 수는 Java String 길이(UTF-16 코드 단위) 기준이라 JavaScript의 String.length와 같은 단위다.

메모가 트리와 같은 슬라이스에 있는 이유는 fsd-layers.md의 "한 응답을 여러 도메인이 나눠 쓸 때"를 따른다.
*/
export const MAX_NODE_NAME_LENGTH = 30;

export const MAX_MEMO_LENGTH = 500;
