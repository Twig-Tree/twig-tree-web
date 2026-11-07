import { type CSSProperties } from "react";

const MOTION_CYCLE_MS = { bounce: 800, shake: 550 } as const; // 표시 시간을 나누기 전 한 번 움직이는 기준 시간

/*
함수 이름 : getLectureHighlightMotionStyle
기능 : 반복 움직임이 표시 시간이 끝날 때 원위치에 닿도록 주기와 반복 횟수를 정한다. CSS 애니메이션은 지워지는 순간 전환 없이 원위치로 튀므로, 끝나는 시점을 주기의 끝에 맞춘다.
인자 : string | null style -> 강조 스타일
number | null durationMs -> 표시 시간. 유지되는 강조처럼 끝이 정해지지 않았으면 null
반환값 : 노드에 넣을 CSS 변수. 맞출 필요가 없으면 undefined
*/
export const getLectureHighlightMotionStyle = (
  style: string | null,
  durationMs: number | null,
): CSSProperties | undefined => {
  if ((style !== "bounce" && style !== "shake") || durationMs === null) {
    return undefined;
  }

  const iterations = Math.max(
    1,
    Math.round(durationMs / MOTION_CYCLE_MS[style]),
  );

  return {
    "--lecture-highlight-cycle": `${durationMs / iterations}ms`,
    "--lecture-highlight-iterations": iterations,
  } as CSSProperties;
};
