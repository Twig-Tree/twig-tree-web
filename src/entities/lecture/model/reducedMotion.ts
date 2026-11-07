import { LECTURE_ATOMIC_EFFECTS } from "./atomicEffects";
import { type LectureAnimation, type LectureAnimationAction } from "./types";

/*
동작 줄이기(reduced-motion)를 켠 사용자에게 보낼 대본을 만든다. 무엇을 바꿀지는 registry의 motion과 durationMeaning 값이 정한다.
- camera: durationMs가 이동 시간(effect)인 focus는 0으로 해 바로 도착한다. reset은 시간이 없다
- layout: 그대로 둔다. collapse·expand의 durationMs는 노드 전환 시간이 아니라 다음 동작까지 기다리는 시간(hold)이다
- decoration: 반복해서 움직이는 꾸밈을 멈춘 꾸밈으로 바꾼다. 강조와 흐림 자체는 내용이라 남긴다
- none: 그대로 둔다. wait의 쉬는 시간은 움직임이 아니라 말의 호흡이다

노드 전환은 대본에 시간이 없어 이 함수로 줄일 수 없다. 편집기 런타임의 useNodeTransition이 getMotionDuration으로 줄이며, 이 정책은 그 처리에 기댄다.
hold를 0으로 바꾸면 런타임이 전환을 줄이지 않는 경우 전환 도중에 다음 동작이 시작되므로 바꾸지 않는다.

이 함수는 컴파일러가 대본 단계에서 적용하기 위한 것으로, 지금은 런타임에 연결하지 않는다.
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
  const { motion, durationMeaning } = LECTURE_ATOMIC_EFFECTS[action.type];

  if (motion === "camera" && durationMeaning === "effect") {
    return "durationMs" in action ? { ...action, durationMs: 0 } : action;
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
