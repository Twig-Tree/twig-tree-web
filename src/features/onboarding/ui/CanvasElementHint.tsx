"use client";

import { useStore } from "@xyflow/react";
import { Coachmark, type CoachmarkPlacement } from "@/src/shared/ui/coachmark";
import type { OnboardingScenarioId } from "../model/scenarios";
import { useOnboardingHint } from "../model/useOnboardingHint";

interface CanvasElementHintProps {
  scenarioId: OnboardingScenarioId; // 안내할 상황
  anchor: HTMLElement | null; // 안내가 가리킬 요소. null이면 상황에 도달하지 않은 것으로 본다
  isReached: boolean; // 화면이 지금 그 상황에 있는지
  isCompleted?: boolean; // 안내가 권한 동작을 사용자가 해 봤는지. true가 되면 닫은 것으로 기록한다
  placement?: CoachmarkPlacement; // 기준 요소의 어느 쪽과 정렬에 띄울지. 생략하면 위
}

/*
함수 이름 : CanvasElementHint
기능 : 트리 캔버스 위에 떠 있는 요소(노드가 아닌 버튼 등)에 안내를 띄운다. ReactFlow 안에서 렌더해야 한다.
인자 : CanvasElementHintProps
반환값 : 요소 옆 안내 카드. 보여 줄 차례가 아니면 null

캔버스 밖 화면의 OnboardingHint와 달리 카드를 React Flow 루트 안에 그린다. CanvasOnboardingHint와 같은 이유로,
좁은 창에서 캔버스 위에 겹쳐 뜨는 패널이 요소와 함께 카드도 덮게 하고, 뒤집기·밀기도 캔버스 안에서 한다.
노드를 가리킬 때는 CanvasOnboardingHint를 쓴다. 노드는 캔버스 이동·확대를 따라가는 기준점이 따로 필요하다.
*/
export function CanvasElementHint({
  scenarioId,
  anchor,
  isReached,
  isCompleted,
  placement,
}: CanvasElementHintProps) {
  const canvasElement = useStore((state) => state.domNode);
  const { isVisible, title, message, dismiss } = useOnboardingHint(
    scenarioId,
    isReached && anchor !== null,
    { isCompleted },
  );

  if (!isVisible) return null;

  return (
    <Coachmark
      anchor={anchor}
      title={title}
      onDismiss={dismiss}
      placement={placement}
      container={canvasElement}
    >
      {message}
    </Coachmark>
  );
}
