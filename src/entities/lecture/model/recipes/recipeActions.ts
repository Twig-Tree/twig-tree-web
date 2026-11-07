import { type LectureMotion } from "../lectureMotion";
import {
  type LectureAnimation,
  type LectureCollapseAction,
  type LectureDimAction,
  type LectureExpandAction,
  type LectureFocusAction,
  type LectureHighlightAction,
  type LectureTraceAction,
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

/*
함수 이름 : createTrace
기능 : 부모→자식 순서의 경로를 따라 연결선을 하나씩 그린다. 전체 시간은 연결선 수에 비례한다.
인자 : string[] nodeIds -> 부모→자식 순서의 경로
LectureMotion motion -> 연결선 하나의 시간과 유지 여부
"forward" | "reverse" direction -> 자식 쪽으로 내려갈지, 부모 쪽으로 올라갈지
반환값 : trace 동작
*/
export const createTrace = (
  nodeIds: string[],
  motion: LectureMotion,
  direction: "forward" | "reverse",
): LectureTraceAction => ({
  type: "trace",
  nodeIds,
  durationMs: motion.durationMs.traceSegment * Math.max(1, nodeIds.length - 1),
  mode: "progressive",
  direction,
  ...(motion.persist ? { persist: true } : {}),
});

/*
함수 이름 : createCollapse
기능 : 노드의 자식을 접고, 노드 전환이 끝날 때까지 기다린다.
인자 : string[] targetNodeIds -> 자식을 접을 노드
LectureMotion motion -> 기다리는 시간
반환값 : collapse 동작
*/
export const createCollapse = (
  targetNodeIds: string[],
  motion: LectureMotion,
): LectureCollapseAction => ({
  type: "collapse",
  targetNodeIds,
  durationMs: motion.durationMs.layoutHold,
});

/*
함수 이름 : createExpand
기능 : 노드의 자식을 펼치고, 노드 전환이 끝날 때까지 기다린다.
인자 : string[] targetNodeIds -> 자식을 펼칠 노드
LectureMotion motion -> 기다리는 시간
반환값 : expand 동작
*/
export const createExpand = (
  targetNodeIds: string[],
  motion: LectureMotion,
): LectureExpandAction => ({
  type: "expand",
  targetNodeIds,
  durationMs: motion.durationMs.layoutHold,
});

type EmphasisStep = {
  nodeIds: string[]; // 이번에 강조할 노드
  style?: LectureHighlightAction["style"]; // 없으면 intensity가 고른 스타일
};

/*
함수 이름 : createEmphasisSteps
기능 : 노드 묶음을 차례로 강조하는 동작 목록을 만든다.
tone이 neutral이면 강조가 "이 노드만 빼고 흐리기"가 된다. 흐림이 여러 개 함께 남으면 서로의 대상을 흐려 모두 흐려지므로,
persist일 때는 차례 강조를 남기지 않고 마지막에 모든 묶음을 남기는 흐림 하나만 유지한다.
인자 : EmphasisStep[] steps -> 차례로 강조할 노드 묶음
LectureMotion motion -> 표시 시간, 스타일, 색, 유지 여부
반환값 : 차례로 실행할 동작 목록
*/
export const createEmphasisSteps = (
  steps: EmphasisStep[],
  motion: LectureMotion,
): LectureAnimation[] => {
  const shouldMergePersistentDim =
    motion.highlightTone === null && motion.persist && steps.length > 1;

  const emphases = steps.map(({ nodeIds, style }) =>
    createEmphasis(nodeIds, motion, {
      style,
      persist: shouldMergePersistentDim ? false : motion.persist,
    }),
  );

  return shouldMergePersistentDim
    ? [
        ...emphases,
        createDim(
          steps.flatMap(({ nodeIds }) => nodeIds),
          motion,
        ),
      ]
    : emphases;
};
