"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import { CoachmarkCard } from "@/src/shared/ui/coachmark";
import type { OnboardingScenarioId } from "../model/scenarios";
import { useOnboardingHint } from "../model/useOnboardingHint";

/*
노드와 카드 사이 간격(px). 꼬리가 반쯤 내민 만큼을 더한다.
아래쪽은 노드 밑으로 튀어나온 접기 버튼을 피해 선택 툴바와 같은 만큼 띄운다.
*/
const NODE_GAP = {
  top: 12,
  bottom: 18,
} as const;

type CanvasOnboardingHintPlacement = keyof typeof NODE_GAP;

/*
카드를 노드 왼쪽 끝에 맞출 때 꼬리를 둘 카드 왼쪽 끝으로부터의 거리(px).
NodeToolbar는 확대해도 크기가 그대로지만 노드는 작아진다. 축소 하한(0.3)에서도 노드 폭(168 × 0.3 ≈ 50px) 안에 들도록 작게 둔다.
*/
const ARROW_START_OFFSET = 16;

interface CanvasOnboardingHintProps {
  scenarioId: OnboardingScenarioId; // 안내할 상황
  nodeId: string | null; // 안내가 가리킬 노드의 편집기 노드 ID. null이면 상황에 도달하지 않은 것으로 본다
  isReached: boolean; // 화면이 지금 그 상황에 있는지
  placement: CanvasOnboardingHintPlacement; // 노드의 위·아래 중 어디에 띄울지. 선택 툴바가 있는 동안 아래쪽은 그 자리다
  align?: "start" | "center"; // 노드의 왼쪽 끝에 맞출지 가운데에 맞출지. 왼쪽에 자리가 없는 노드는 start. 생략하면 center
  isCompleted?: boolean; // 안내가 권한 동작을 사용자가 해 봤는지. true가 되면 닫은 것으로 기록한다
}

/*
함수 이름 : CanvasOnboardingHint
기능 : 트리 캔버스의 노드 위나 아래에 안내를 띄운다. ReactFlow 안에서 렌더해야 한다.
인자 : CanvasOnboardingHintProps
반환값 : 노드 옆 안내 카드. 보여 줄 차례가 아니면 null

캔버스를 옮기거나 확대하면 화면 좌표가 계속 바뀌므로 floating-ui 대신 NodeToolbar가 노드를 따라가게 한다. 크기는 확대와 관계없이 그대로다.
NodeToolbar는 자리가 모자라도 뒤집거나 밀지 않으므로, 어느 쪽이 비어 있는지는 호출하는 쪽이 정한다.
*/
export function CanvasOnboardingHint({
  scenarioId,
  nodeId,
  isReached,
  placement,
  align = "center",
  isCompleted,
}: CanvasOnboardingHintProps) {
  const { isVisible, message, dismiss } = useOnboardingHint(
    scenarioId,
    isReached && nodeId !== null,
    { isCompleted },
  );

  if (!isVisible || nodeId === null) return null;

  return (
    <NodeToolbar
      nodeId={nodeId}
      isVisible
      position={placement === "top" ? Position.Top : Position.Bottom}
      offset={NODE_GAP[placement]}
      align={align}
      /*
      선택 툴바와 같이 노드보다 위, 캔버스 패널(5)보다는 아래에 둔다. NodeActionToolbar의 설명을 참고한다.
      감싸는 상자도 카드처럼 클릭을 흘려보내 아래 노드를 누를 수 있게 한다.
      */
      style={{ zIndex: 4, pointerEvents: "none" }}
      className="nodrag nopan nowheel"
    >
      <CoachmarkCard
        onDismiss={dismiss}
        arrowSide={placement === "top" ? "bottom" : "top"}
        arrowStyle={
          align === "start" ? { left: ARROW_START_OFFSET } : undefined
        }
      >
        {message}
      </CoachmarkCard>
    </NodeToolbar>
  );
}
