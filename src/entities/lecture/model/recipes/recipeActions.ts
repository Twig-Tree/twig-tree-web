import { type LectureMotion } from "../lectureMotion";
import {
  type LectureAnimation,
  type LectureDimAction,
  type LectureFocusAction,
  type LectureHighlightAction,
  type LectureWaitAction,
} from "../types";

/*
recipe들이 함께 쓰는 동작 조립 함수. 시간·배율·색은 모두 motion에서 읽어 recipe 본문에 숫자가 남지 않게 한다.
*/

/*
함수 이름 : createSequence
기능 : 동작을 차례로 실행하는 그룹을 만든다. 하나뿐이면 그룹 없이 그대로 돌려준다.
인자 : LectureAnimation[] children -> 실행할 애니메이션 목록
반환값 : 순차 그룹 또는 단일 애니메이션
*/
export const createSequence = (
  children: LectureAnimation[],
): LectureAnimation =>
  children.length === 1
    ? children[0]
    : { type: "group", mode: "sequence", children };

/*
함수 이름 : createParallel
기능 : 동작을 동시에 시작하는 그룹을 만든다. 하나뿐이면 그룹 없이 그대로 돌려준다.
인자 : LectureAnimation[] children -> 함께 실행할 애니메이션 목록
반환값 : 병렬 그룹 또는 단일 애니메이션
*/
export const createParallel = (
  children: LectureAnimation[],
): LectureAnimation =>
  children.length === 1
    ? children[0]
    : { type: "group", mode: "parallel", children };

/*
함수 이름 : createFocus
기능 : 노드들을 한 화면에 모으는 카메라 이동을 만든다.
인자 : string[] targetNodeIds -> 화면에 모을 노드
LectureMotion motion -> 이동 시간과 확대 배율
반환값 : focus 동작
*/
export const createFocus = (
  targetNodeIds: string[],
  motion: LectureMotion,
): LectureFocusAction => ({
  type: "focus",
  targetNodeIds,
  maxZoom: motion.focusMaxZoom,
  durationMs: motion.durationMs.camera,
});

/*
함수 이름 : createDim
기능 : 주어진 노드만 남기고 나머지를 흐린다. persist는 motion을 따른다.
인자 : string[] exceptNodeIds -> 흐리지 않을 노드
LectureMotion motion -> 표시 시간과 유지 여부
반환값 : dim 동작
*/
export const createDim = (
  exceptNodeIds: string[],
  motion: LectureMotion,
): LectureDimAction => ({
  type: "dim",
  exceptNodeIds,
  durationMs: motion.durationMs.emphasis,
  ...(motion.persist ? { persist: true } : {}),
});

type CreateEmphasisOptions = {
  style?: LectureHighlightAction["style"]; // 없으면 intensity가 고른 스타일. bounce·shake처럼 의미가 있는 움직임만 recipe가 직접 고른다
  persist?: boolean; // 없으면 motion을 따른다
};

/*
함수 이름 : createEmphasis
기능 : 노드를 강조한다. tone이 neutral이면 강조 색을 쓰지 않으므로, 대상만 남기고 주변을 흐리는 동작으로 대신한다.
인자 : string[] targetNodeIds -> 강조할 노드
LectureMotion motion -> 표시 시간, 스타일, 색, 유지 여부
CreateEmphasisOptions options -> recipe가 직접 고르는 값
반환값 : highlight 동작, neutral이면 dim 동작
*/
export const createEmphasis = (
  targetNodeIds: string[],
  motion: LectureMotion,
  {
    style = motion.highlightStyle,
    persist = motion.persist,
  }: CreateEmphasisOptions = {},
): LectureHighlightAction | LectureDimAction => {
  if (motion.highlightTone === null) {
    return createDim(targetNodeIds, { ...motion, persist });
  }

  return {
    type: "highlight",
    targetNodeIds,
    style,
    tone: motion.highlightTone,
    durationMs: motion.durationMs.emphasis,
    ...(persist ? { persist: true } : {}),
  };
};

/*
함수 이름 : createPause
기능 : 다음 동작 전에 쉬는 시간을 만든다.
인자 : LectureMotion motion -> 쉬는 시간
반환값 : wait 동작
*/
export const createPause = (motion: LectureMotion): LectureWaitAction => ({
  type: "wait",
  durationMs: motion.durationMs.pause,
});
