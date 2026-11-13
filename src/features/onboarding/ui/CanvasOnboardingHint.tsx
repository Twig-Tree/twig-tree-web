"use client";

import { NodeToolbar, Position, useStore } from "@xyflow/react";
import { useState } from "react";
import { Coachmark, type CoachmarkPlacement } from "@/src/shared/ui/coachmark";
import type { OnboardingScenarioId } from "../model/scenarios";
import { useOnboardingHint } from "../model/useOnboardingHint";

/*
노드와 카드 사이 간격(px). 꼬리가 반쯤 내민 만큼을 더한다.
아래쪽은 노드 밑으로 튀어나온 접기 버튼을 피해 선택 툴바와 같은 만큼 띄운다.
*/
const NODE_ANCHOR_OFFSET = {
  top: 2,
  bottom: 8,
} as const;

type CanvasOnboardingHintPlacement = keyof typeof NODE_ANCHOR_OFFSET;

const COACHMARK_PLACEMENT: Record<
  CanvasOnboardingHintPlacement,
  Record<"start" | "center", CoachmarkPlacement>
> = {
  top: { start: "top-start", center: "top" },
  bottom: { start: "bottom-start", center: "bottom" },
};

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

NodeToolbar의 1px 기준점을 노드에 붙여 캔버스 이동·확대를 따라가게 하고, 실제 카드는 Coachmark가 body에 그린다.
따라서 카드 크기는 확대와 관계없이 유지하면서 화면 가장자리에서는 flip·shift로 잘리지 않는다.
카드는 React Flow 루트 안에 그려, 좁은 화면에서 캔버스 위에 겹쳐 뜨는 패널이 노드와 함께 카드도 덮게 한다. 뒤집기·밀기도 캔버스 안에서 한다.
*/
export function CanvasOnboardingHint({
  scenarioId,
  nodeId,
  isReached,
  placement,
  align = "center",
  isCompleted,
}: CanvasOnboardingHintProps) {
  const canvasElement = useStore((state) => state.domNode); // React Flow 루트. 캔버스 밖 패널보다 아래에 쌓인다.
  const [anchorElement, setAnchorElement] = useState<HTMLSpanElement | null>(
    null,
  );
  const { isVisible, title, message, dismiss } = useOnboardingHint(
    scenarioId,
    isReached && nodeId !== null,
    { isCompleted },
  );

  if (!isVisible || nodeId === null) return null;

  return (
    <>
      <NodeToolbar
        nodeId={nodeId}
        isVisible
        position={placement === "top" ? Position.Top : Position.Bottom}
        offset={NODE_ANCHOR_OFFSET[placement]}
        align={align}
        style={{ pointerEvents: "none" }}
        className="nodrag nopan nowheel"
      >
        <span ref={setAnchorElement} aria-hidden className="block size-px" />
      </NodeToolbar>

      <Coachmark
        anchor={anchorElement}
        title={title}
        onDismiss={dismiss}
        placement={COACHMARK_PLACEMENT[placement][align]}
        container={canvasElement}
      >
        {message}
      </Coachmark>
    </>
  );
}
