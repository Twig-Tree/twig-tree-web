import { useEffect, useState } from "react";
import { getRevealedNarrationLength } from "../../lib/lecture/getRevealedNarrationLength";
import { prefersReducedMotion } from "../../lib/motion";

type UseNarrationTypewriterParams = {
  characterCount: number; // 자막 전체 글자 수
  narrationDurationMs: number; // 비트의 내레이션 시간. 이 시간 안에 글자를 모두 보여 준다
  isPlaying: boolean; // 강의가 재생 중인지. 일시정지하면 글자가 멈춘다
};

/*
함수 이름 : useNarrationTypewriter
기능 : 자막을 내레이션 시간에 맞춰 한 글자씩 드러낼 글자 수를 구한다. 일시정지한 시간은 세지 않고,
동작 줄이기를 켰으면 처음부터 모두 보여 준다. 비트가 바뀌면 부르는 쪽이 key로 새로 마운트한다.
인자 : UseNarrationTypewriterParams
반환값 : 지금 보여 줄 글자 수
*/
export const useNarrationTypewriter = ({
  characterCount,
  narrationDurationMs,
  isPlaying,
}: UseNarrationTypewriterParams): number => {
  const [isReducedMotion] = useState(prefersReducedMotion);
  const [elapsedMs, setElapsedMs] = useState(0);

  const revealedLength = isReducedMotion
    ? characterCount
    : getRevealedNarrationLength(
        characterCount,
        elapsedMs,
        narrationDurationMs,
      );
  const isComplete = revealedLength >= characterCount;

  useEffect(() => {
    if (!isPlaying || isComplete) return;

    /*
    재생을 다시 시작한 시점부터 프레임 사이 시간만 더한다. 일시정지 동안의 시간이 한꺼번에 더해지지 않게 하기 위해서다.
    */
    let previousTime: number | null = null;
    let frameId = window.requestAnimationFrame(function tick(time) {
      if (previousTime !== null) {
        const deltaMs = time - previousTime;
        setElapsedMs((elapsed) => elapsed + deltaMs);
      }

      previousTime = time;
      frameId = window.requestAnimationFrame(tick);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, isComplete]);

  return revealedLength;
};
