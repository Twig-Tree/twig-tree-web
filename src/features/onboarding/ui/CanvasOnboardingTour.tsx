"use client";

import { useStore } from "@xyflow/react";
import { Coachmark } from "@/src/shared/ui/coachmark";
import type { OnboardingScenarioId } from "../model/scenarios";
import { useOnboardingTour } from "../model/useOnboardingTour";

interface CanvasOnboardingTourProps {
  scenarioId: OnboardingScenarioId; // 안내할 상황. 단계가 있어야 한다
  isReached: boolean; // 화면이 지금 그 상황에 있는지
  anchor: HTMLElement | null; // 카드를 맞출 요소. 단계 요소들을 감싼 묶음. 예: 선택 툴바
  targets: Readonly<Record<string, HTMLElement | null>>; // 단계의 target 이름표별로 꼬리가 가리킬 요소. 아직 그려지지 않았으면 null
}

/*
함수 이름 : CanvasOnboardingTour
기능 : 트리 캔버스 위의 요소들을 단계마다 하나씩 가리키며 안내한다. ReactFlow 안에서 렌더해야 한다.
인자 : CanvasOnboardingTourProps
반환값 : 단계 요소 묶음 아래에 띄운 안내 카드. 보여 줄 차례가 아니거나 요소가 없으면 null

가리키는 요소는 선택 툴바의 버튼처럼 이미 노드를 따라 움직이므로, CanvasOnboardingHint와 달리 기준점을 따로 두지 않는다.
카드는 단계 요소를 감싼 묶음에 맞춰 제자리에 두고 꼬리만 단계 요소로 옮긴다. 카드가 단계마다 움직이면 다음 버튼도 움직여, 연달아 누르는 마우스가 빗나간다.
카드는 묶음 아래에 둔다. 위에 두면 선택한 노드를 가린다. 아래는 버튼 툴팁 자리지만 투어 중에는 카드가 같은 설명을 더 자세히 한다.
카드는 CanvasOnboardingHint와 같은 이유로 React Flow 루트 안에 그린다.
*/
export function CanvasOnboardingTour({
  scenarioId,
  isReached,
  anchor,
  targets,
}: CanvasOnboardingTourProps) {
  const canvasElement = useStore((state) => state.domNode);
  const { isVisible, step, progress, goToPrevious, goToNext, dismiss } =
    useOnboardingTour(scenarioId, isReached);

  const target = step ? (targets[step.target] ?? null) : null;

  if (!isVisible || !step || !target) return null;

  return (
    <Coachmark
      anchor={anchor}
      arrowTarget={target}
      title={step.title}
      onDismiss={dismiss}
      step={progress}
      onPrevious={goToPrevious}
      onNext={goToNext}
      placement="bottom"
      container={canvasElement}
    >
      {step.message}
    </Coachmark>
  );
}
