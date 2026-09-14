/*
함수 이름 : formatUpdatedAt
기능 : 서버가 준 수정 시각을 화면에 표시할 문자열로 변환한다.
인자 : string updatedAt -> 서버 응답의 ISO 문자열
반환값 : "2026-08-31 21:00" 형태의 날짜와 시각. 해석할 수 없는 값이면 null

서버 값을 보정하지 않고 그대로 파싱한다. 백엔드가 지금은 오프셋 없는 값을 주고 있어
표시되는 시각이 사용자 시간대와 어긋나지만, 오프셋이 붙으면 Date가 그것을 반영하므로
이 함수를 고치지 않아도 표시가 맞아진다.

시각까지 표시하는 것은 그 시점을 화면에서 바로 확인하기 위해서다. 날짜만 보여주면
어긋남이 자정을 넘길 때만 드러나 오프셋이 반영되었는지 알아보기 어렵다.

없는 오프셋을 프론트에서 추측해 붙이지 않는다. `${updatedAt}Z`처럼 보정하면 백엔드가
오프셋을 주기 시작하는 순간 이중 보정이 되어 틀린다.
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
