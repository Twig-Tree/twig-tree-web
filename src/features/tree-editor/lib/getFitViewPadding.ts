/*
함수 이름 : getFitViewPadding
기능 : 화면 맞춤에 쓸 방향별 여백을 만든다. 도구 버튼이 캔버스 위쪽에 떠 있어 위 여백을 버튼 높이보다 크게 두어 맨 위 노드를 가리지 않게 한다.
인자 : number bottomInset -> 캔버스 아래쪽에서 다른 UI가 가리는 높이
반환값 : React Flow fitView의 padding 옵션
*/
export const getFitViewPadding = (
  bottomInset = 0,
): Record<"top" | "right" | "bottom" | "left", `${number}px`> => ({
  top: "72px",
  right: "24px",
  bottom: `${bottomInset + 24}px`,
  left: "24px",
});
