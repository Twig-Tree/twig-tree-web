/*
함수 이름 : getApiFolderId
기능 : 프론트엔드 폴더 ID를 백엔드 요청에 쓸 숫자로 변환한다. 부모 없음을 뜻하는 null은 그대로 유지한다.
자기 ID처럼 null일 수 없는 곳에 쓰면 반환 타입도 number로 좁혀진다.
인자 : string | null folderId -> 프론트엔드 폴더 ID
반환값 : 백엔드에 보낼 폴더 ID. null이면 그대로 null
*/
export function getApiFolderId(folderId: string): number;
export function getApiFolderId(folderId: string | null): number | null;
export function getApiFolderId(folderId: string | null): number | null {
  return folderId === null ? null : Number(folderId);
}

/*
함수 이름 : isValidFolderId
기능 : 폴더 ID가 API 요청에 쓸 수 있는 값인지 검사한다. 부모 없음을 뜻하는 null은 유효하고,
그 외에는 양의 안전정수여야 한다. null 확인이 숫자 변환보다 먼저다 — Number(null)은 0이다.
인자 : string | null folderId -> 검사할 폴더 ID
반환값 : 유효하면 true
*/
export const isValidFolderId = (folderId: string | null): boolean => {
  if (folderId === null) return true;

  const apiFolderId = Number(folderId);
  return Number.isSafeInteger(apiFolderId) && apiFolderId > 0;
};
