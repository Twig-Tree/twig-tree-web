/*
함수 이름 : formatUpdatedAt
기능 : 서버가 준 수정 시각을 화면에 표시할 문자열로 변환한다.
인자 : string updatedAt -> 서버 응답의 ISO 문자열
반환값 : "2026-08-31 21:00" 형태의 사용자 시간대 날짜와 시각. 해석할 수 없는 값이면 null

서버는 UTC 시각에 `Z`를 붙여 준다. 소수 초는 조회 응답이 6자리, 수정 응답이 9자리다.
서버 값을 보정하지 않고 그대로 파싱하므로 Date가 오프셋을 반영해 사용자 시간대로 바꾼다.

오프셋을 프론트에서 추측해 붙이지 않는다. 백엔드가 오프셋 없는 값을 주던 때에도
`${updatedAt}Z`처럼 보정하지 않았는데, 그랬다면 오프셋이 붙은 지금 이중 보정이 되어 틀린다.

시각까지 표시하는 것은 시간대가 맞는지 화면에서 바로 확인하기 위해서다. 날짜만 보여주면
어긋남이 자정을 넘길 때만 드러난다.
*/
export const formatUpdatedAt = (updatedAt: string): string | null => {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
