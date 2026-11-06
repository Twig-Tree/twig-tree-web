import { useEffect, useEffectEvent } from "react";
import { useLectureStore } from "./lectureStore";

type UseLectureKeyboardParams = {
  onStop: () => void; // 강의를 끝내는 함수. 카메라 복귀까지 플레이어가 맡으므로 넘겨받는다
};

const TEXT_INPUT_SELECTOR = "input, textarea, select, [contenteditable]";
const ACTIVATABLE_SELECTOR = 'button, a[href], summary, [role="button"]';
const OPEN_OVERLAY_SELECTOR =
  '[role="menu"], [role="dialog"], [role="alertdialog"], dialog[open]';

/*
함수 이름 : isClosestMatch
기능 : 이벤트가 일어난 요소나 그 조상이 선택자에 맞는지 확인한다.
인자 : EventTarget | null target -> 키 이벤트의 대상
string selector -> 확인할 선택자
반환값 : 맞으면 true
*/
const isClosestMatch = (target: EventTarget | null, selector: string) =>
  target instanceof Element && target.closest(selector) !== null;

/*
함수 이름 : useLectureKeyboard
기능 : 강의가 진행되는 동안 키보드로 재생을 조작한다. Space는 일시정지와 재생, Shift + →는 다음 장면, Esc는 강의 종료다.
인자 : UseLectureKeyboardParams
반환값 : 없음

입력 중이거나 메뉴가 열려 있으면 그 UI의 키이므로 동작하지 않는다. 버튼에 포커스가 있으면 Space는 버튼을 누르는 키이므로,
같이 처리하면 일시정지 버튼에서 일시정지와 재생이 함께 일어난다.
*/
export const useLectureKeyboard = ({ onStop }: UseLectureKeyboardParams) => {
  const status = useLectureStore((state) => state.status);
  const isLectureActive = status === "playing" || status === "paused";

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isClosestMatch(event.target, TEXT_INPUT_SELECTOR)) return;
    if (document.querySelector(OPEN_OVERLAY_SELECTOR)) return;

    const lecture = useLectureStore.getState();

    if (event.key === " " && !event.shiftKey) {
      if (isClosestMatch(event.target, ACTIVATABLE_SELECTOR)) return;

      event.preventDefault(); // 페이지가 스크롤되지 않게 한다.

      if (lecture.status === "playing") lecture.pauseLecture();
      else lecture.resumeLecture();

      return;
    }

    if (event.key === "ArrowRight" && event.shiftKey) {
      event.preventDefault();
      lecture.goToNextScene();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onStop();
    }
  });

  useEffect(() => {
    if (!isLectureActive) return;

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLectureActive]);
};
