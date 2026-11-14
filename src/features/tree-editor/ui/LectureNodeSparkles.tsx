import { type CSSProperties } from "react";

type SparklePlacement = {
  x: string; // 노드 왼쪽 위에서 잰 가로 위치. 노드 폭에 대한 비율이라 노드 크기와 관계없이 둘레에 놓인다
  y: string; // 노드 왼쪽 위에서 잰 세로 위치
  size: number; // 반짝이 한 변의 길이(px)
  delayMs: number; // 반짝이마다 시작을 어긋나게 해 한꺼번에 깜빡이지 않게 한다
};

/*
노드 둘레의 반짝이 자리. 화면마다 같은 모양이 나오도록 무작위가 아니라 고정값을 쓴다.
모서리 쪽은 크게, 변 가운데는 작게 두어 노드를 감싸는 모양이 되게 한다.
*/
const SPARKLE_PLACEMENTS: SparklePlacement[] = [
  { x: "-6%", y: "-30%", size: 22, delayMs: 0 },
  { x: "48%", y: "-42%", size: 13, delayMs: 380 },
  { x: "104%", y: "-24%", size: 18, delayMs: 160 },
  { x: "112%", y: "62%", size: 13, delayMs: 520 },
  { x: "96%", y: "128%", size: 22, delayMs: 260 },
  { x: "40%", y: "140%", size: 13, delayMs: 640 },
  { x: "-10%", y: "118%", size: 18, delayMs: 100 },
  { x: "-16%", y: "40%", size: 13, delayMs: 460 },
];

/*
함수 이름 : LectureNodeSparkles
기능 : sparkle 강조를 받은 노드 둘레에 반짝이를 띄운다. 색은 노드의 강조 톤(--lecture-highlight-color)을 따른다.
인자 : 없음
반환값 : 노드 둘레의 반짝이 묶음
*/
export function LectureNodeSparkles() {
  return (
    <span
      aria-hidden="true"
      data-testid="lecture-sparkles"
      className="lecture-sparkles pointer-events-none absolute inset-0"
    >
      {SPARKLE_PLACEMENTS.map(({ x, y, size, delayMs }) => (
        <span
          key={`${x}:${y}`}
          className="lecture-sparkle"
          style={
            {
              left: x,
              top: y,
              width: size,
              height: size,
              animationDelay: `${delayMs}ms`,
            } satisfies CSSProperties
          }
        />
      ))}
    </span>
  );
}
