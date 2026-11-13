"use client";

import { useState } from "react";
import {
  ONBOARDING_SCENARIOS,
  type OnboardingScenarioId,
  type OnboardingTourStep,
} from "./scenarios";
import { useOnboardingHint } from "./useOnboardingHint";

const getTourSteps = (
  scenarioId: OnboardingScenarioId,
): readonly OnboardingTourStep[] => {
  const scenario = ONBOARDING_SCENARIOS.find(({ id }) => id === scenarioId);

  return scenario && "steps" in scenario ? scenario.steps : [];
};

interface UseOnboardingTourOptions {
  availableTargets?: readonly string[]; // 지금 화면에 있는 단계 target. 없는 단계는 건너뛰고 번호도 남은 단계로 센다. 생략하면 모든 단계를 보인다
}

/*
함수 이름 : useOnboardingTour
기능 : 여러 요소를 차례로 가리키는 안내의 지금 단계와 이동·닫기 함수를 돌려준다.
보일지와 본 기록은 useOnboardingHint와 같다. 단계는 화면 상태라 기록하지 않고, 안내가 숨으면 첫 단계로 되돌린다.
인자 : OnboardingScenarioId scenarioId -> 안내할 상황. 단계가 없는 상황이면 보이지 않는다
boolean isReached -> 화면이 지금 그 상황에 있는지
UseOnboardingTourOptions options
반환값 : 보여 줄지 여부, 지금 단계, 몇 번째 단계인지, 이전·다음 함수, 닫기 함수
이전은 첫 단계에서, 다음은 마지막 단계에서 undefined다. CoachmarkCard는 다음이 없으면 완료를 그린다.
*/
export const useOnboardingTour = (
  scenarioId: OnboardingScenarioId,
  isReached: boolean,
  { availableTargets }: UseOnboardingTourOptions = {},
) => {
  const { isVisible, dismiss } = useOnboardingHint(scenarioId, isReached);

  /*
  가리킬 요소가 없는 단계에서 투어가 멈추지 않게 건너뛴다. 예: 접고 펼칠 트리가 없으면 계층 조절 버튼이 없다.
  */
  const steps = getTourSteps(scenarioId).filter(
    ({ target }) => !availableTargets || availableTargets.includes(target),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [wasVisible, setWasVisible] = useState(isVisible);

  /*
  상황을 벗어나 안내가 숨으면 첫 단계로 되돌린다. 예: 투어 중 노드 선택을 풀었다가 다시 고르면 처음부터 본다.
  effect로 되돌리면 다시 보이는 첫 렌더에 이전 단계가 한 번 그려지므로 렌더 중에 맞춘다.
  */
  if (wasVisible !== isVisible) {
    setWasVisible(isVisible);
    if (!isVisible) setStepIndex(0);
  }

  const currentIndex = Math.min(stepIndex, steps.length - 1); // 투어 중 뒤쪽 단계의 요소가 사라지면 남은 마지막 단계에 머문다.
  const step = steps.at(currentIndex) ?? null;

  return {
    isVisible: isVisible && step !== null,
    step,
    progress: { current: currentIndex + 1, total: steps.length },
    goToPrevious:
      currentIndex > 0 ? () => setStepIndex(currentIndex - 1) : undefined,
    goToNext:
      currentIndex < steps.length - 1
        ? () => setStepIndex(currentIndex + 1)
        : undefined,
    dismiss,
  };
};
