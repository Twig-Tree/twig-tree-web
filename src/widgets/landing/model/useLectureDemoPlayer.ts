import { useCallback, useEffect, useState } from "react";

interface UseLectureDemoPlayerParams {
  stepCount: number; // 강의가 설명하는 노드 수
  stepDurationMs: number; // 재생 중 한 노드에 머무는 시간
}

/*
함수 이름 : useLectureDemoPlayer
기능 : 소개 페이지 강의 데모의 현재 단계와 재생 상태를 관리한다. 재생 중에는 단계마다 정해진 시간이 지나면 다음 단계로 넘어가고, 마지막 단계 다음에는 처음으로 돌아간다.
인자 : UseLectureDemoPlayerParams
반환값 : 현재 단계 번호, 재생 여부, 이전·다음·재생·일시정지 핸들러
*/
export const useLectureDemoPlayer = ({
  stepCount,
  stepDurationMs,
}: UseLectureDemoPlayerParams) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  /*
  단계가 바뀔 때마다 타이머를 새로 건다. 재생 중 사용자가 직접 넘긴 단계도 정해진 시간을 온전히 보여준다.
  */
  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(() => {
      setStepIndex((index) => (index + 1) % stepCount);
    }, stepDurationMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIndex, stepCount, stepDurationMs]);

  const goToPrevious = useCallback(() => {
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const goToNext = useCallback(() => {
    setStepIndex((index) => Math.min(stepCount - 1, index + 1));
  }, [stepCount]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  return {
    stepIndex,
    isPlaying,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === stepCount - 1,
    goToPrevious,
    goToNext,
    play,
    pause,
  };
};
