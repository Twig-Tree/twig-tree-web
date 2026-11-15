/*
트리 편집기 단축키(노드 동작, 실행 취소·다시 실행)가 키를 넘길지 정할 때 함께 쓰는 선택자.
강의 키보드 조작은 단축키 안내 예외가 없는 선택자를 따로 쓴다.
*/
export const TEXT_INPUT_SELECTOR = "input, textarea, select, [contenteditable]";
export const ACTIVATABLE_SELECTOR = 'button, a[href], summary, [role="button"]';

/*
단축키 안내처럼 화면 한쪽에 떠 있는 참고 패널은 data-non-blocking을 붙여 단축키를 막지 않는다.
막으면 안내를 연 채 노드를 누른 뒤 모든 단축키가 동작하지 않는다.
*/
export const OPEN_OVERLAY_SELECTOR =
  '[role="menu"], [role="dialog"]:not([data-non-blocking]), [role="alertdialog"], dialog[open]';

/*
함수 이름 : isClosestMatch
기능 : 이벤트가 일어난 요소나 그 조상이 선택자에 맞는지 확인한다.
인자 : EventTarget | null target -> 키 이벤트의 대상
string selector -> 확인할 선택자
반환값 : 맞으면 true
*/
export const isClosestMatch = (target: EventTarget | null, selector: string) =>
  target instanceof Element && target.closest(selector) !== null;
