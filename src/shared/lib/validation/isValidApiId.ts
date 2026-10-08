const API_ID_PATTERN = /^[1-9]\d*$/; // 0으로 시작하지 않는 10진수 숫자열

/*
함수 이름 : isValidApiId
기능 : 프론트엔드 ID 문자열이 백엔드 요청에 쓸 수 있는 양의 정수 ID인지 검사한다.
인자 : string id -> 검사할 프론트엔드 ID
반환값 : 유효하면 true

Number()만으로 판단하지 않는다. "1e3", "0x10", "012", " 12"처럼 Number()가 정수로 읽는 표기가
통과하면 URL의 문자열과 실제 요청 ID가 달라지고, 같은 리소스가 다른 query key로 캐시에 갈린다.
문자열이 그대로 정규형 10진수일 때만 받는다.
*/
export function isValidApiId(id: string): boolean {
  return API_ID_PATTERN.test(id) && Number.isSafeInteger(Number(id));
}
