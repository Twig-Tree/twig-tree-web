/*
자막을 다 보여 주는 시점을 내레이션 시간의 이 비율로 둔다. 문장 끝까지 글자가 차오르면 읽기 전에 다음 비트로 넘어가므로
마지막 글자가 보인 뒤 잠시 머물 시간을 남긴다.
*/
export const NARRATION_REVEAL_RATIO = 0.85;

/*
함수 이름 : getRevealedNarrationLength
기능 : 자막 타자 효과에서 지금까지 보여 줄 글자 수를 구한다. 글자는 화면에 보이는 문자 단위(code point)로 센다.
인자 : number characterCount -> 자막 전체 글자 수
number elapsedMs -> 자막을 보이기 시작한 뒤 재생한 시간(ms). 일시정지한 시간은 빠진다
number narrationDurationMs -> 비트의 내레이션 시간(ms)
반환값 : 0과 characterCount 사이의 보여 줄 글자 수
*/
export const getRevealedNarrationLength = (
  characterCount: number,
  elapsedMs: number,
  narrationDurationMs: number,
): number => {
  const revealDurationMs = narrationDurationMs * NARRATION_REVEAL_RATIO;

  if (revealDurationMs <= 0) return characterCount;

  const progress = Math.min(Math.max(elapsedMs / revealDurationMs, 0), 1);

  return Math.ceil(characterCount * progress);
};
