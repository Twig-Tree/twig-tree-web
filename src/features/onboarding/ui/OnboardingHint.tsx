"use client";

import { Coachmark, type CoachmarkSide } from "@/src/shared/ui/coachmark";
import type { OnboardingScenarioId } from "../model/scenarios";
import { useOnboardingHint } from "../model/useOnboardingHint";

interface OnboardingHintProps {
  scenarioId: OnboardingScenarioId; // 안내할 상황
  anchor: HTMLElement | null; // 안내가 가리킬 요소. 호출하는 쪽이 useState의 setter를 ref에 넘겨 받는다
  isReached: boolean; // 화면이 지금 그 상황에 있는지. false면 순서를 다음 안내에 넘긴다
  placement?: CoachmarkSide; // 기준 요소의 어느 쪽에 띄울지. 생략하면 위
}

/*
함수 이름 : OnboardingHint
기능 : 상황에 도달했고 아직 닫지 않은 안내를 기준 요소 옆에 띄운다. 캔버스 밖 화면에서 쓴다.
인자 : OnboardingHintProps
반환값 : 안내 카드. 보여 줄 차례가 아니면 null
*/
export function OnboardingHint({
  scenarioId,
  anchor,
  isReached,
  placement,
}: OnboardingHintProps) {
  const { isVisible, message, dismiss } = useOnboardingHint(
    scenarioId,
    isReached && anchor !== null,
  );

  if (!isVisible) return null;

  return (
    <Coachmark anchor={anchor} onDismiss={dismiss} placement={placement}>
      {message}
    </Coachmark>
  );
}
