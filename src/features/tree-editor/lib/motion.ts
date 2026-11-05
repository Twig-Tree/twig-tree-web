import { MOTION_DURATION_MS } from "../constants/motion";

/*
함수 이름 : prefersReducedMotion
기능 : 사용자가 운영체제에서 동작 줄이기를 켰는지 확인한다.
인자 : 없음
반환값 : 동작 줄이기를 켰으면 true
*/
export const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/*
함수 이름 : getMotionDuration
기능 : 이번 애니메이션에 쓸 시간을 구한다. 설정은 언제든 바뀔 수 있어 애니메이션을 시작할 때마다 읽는다.
인자 : 없음
반환값 : 애니메이션 시간(ms). 동작 줄이기를 켰으면 0
*/
export const getMotionDuration = (): number =>
  prefersReducedMotion() ? 0 : MOTION_DURATION_MS;

/*
함수 이름 : easeCubicInOut
기능 : 진행률에 가감속을 입힌다. React Flow가 화면 이동에 쓰는 기본 곡선과 같아 노드와 화면이 같은 리듬으로 움직인다.
인자 : number progress -> 0과 1 사이의 시간 진행률
반환값 : 0과 1 사이의 이동 진행률
*/
export const easeCubicInOut = (progress: number): number =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
