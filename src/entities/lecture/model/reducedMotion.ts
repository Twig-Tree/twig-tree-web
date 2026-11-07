import { LECTURE_ATOMIC_EFFECTS } from "./atomicEffects";
import { type LectureAnimation, type LectureAnimationAction } from "./types";

/*
동작 줄이기(reduced-motion)를 켠 사용자에게 보낼 대본을 만든다. 무엇을 바꿀지는 registry의 motion 값이 정한다.
- camera, layout: 화면이나 노드가 옮겨 가는 시간을 0으로 해 바로 도착한다
- decoration: 반복해서 움직이는 꾸밈을 멈춘 꾸밈으로 바꾼다. 강조와 흐림 자체는 내용이라 남긴다
- none: 그대로 둔다. wait의 쉬는 시간은 움직임이 아니라 말의 호흡이다

편집기 런타임도 카메라·노드 전환 시간과 CSS 반복 애니메이션을 따로 줄이고 있다. 이 함수는 컴파일러가 대본 단계에서 같은 정책을 적용하기 위한 것으로, 지금은 런타임에 연결하지 않는다.
*/

/*
함수 이름 : getReducedMotionAction
기능 : 단위 동작 하나를 동작 줄이기 정책에 맞게 바꾼다.
인자 : A action -> 단위 동작
반환값 : 바꾼 동작. 바꿀 것이 없으면 같은 객체
*/
export const getReducedMotionAction = <A extends LectureAnimationAction>(
  action: A,
): A => {
  const { motion } = LECTURE_ATOMIC_EFFECTS[action.type];

  if (motion === "camera" || motion === "layout") {
    return "durationMs" in action ? { ...action, durationMs: 0 } : action; // reset은 시간이 없다
  }

  if (motion !== "decoration") return action;

  if (action.type === "highlight" && action.style !== "steady") {
    return { ...action, style: "steady" };
  }

  /*
  순차 추적은 연결선을 하나씩 그려 나가는 움직임이라 한 번에 드러내는 동시 추적으로 바꾼다. 전체 시간은 그대로다.
  */
  if (action.type === "trace" && action.mode === "progressive") {
    return { ...action, mode: "simultaneous" };
  }

  return action;
};

/*
함수 이름 : getReducedMotionAnimation
기능 : 그룹 안의 동작까지 모두 동작 줄이기 정책에 맞게 바꾼다. 그룹의 순서와 병렬 구조는 바꾸지 않는다.
인자 : LectureAnimation animation -> 비트의 애니메이션
반환값 : 바꾼 애니메이션
*/
export const getReducedMotionAnimation = (
  animation: LectureAnimation,
): LectureAnimation =>
  animation.type === "group"
    ? {
        ...animation,
        children: animation.children.map(getReducedMotionAnimation),
      }
    : getReducedMotionAction(animation);
