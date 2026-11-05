import { ViewportPortal } from "@xyflow/react";
import { DropIndicator } from "../lib/move-node/getDropIndicator";

type DropIndicatorOverlayProps = {
  indicator: DropIndicator | null; // 놓일 자리 표시. 없으면 그리지 않는다
};

/*
함수 이름 : DropIndicatorOverlay
기능 : 끄는 노드가 놓일 자리를 그린다. 형제 앞뒤면 삽입선을, 자식이면 기준 노드를 둘러싼 점선 테두리를 그린다.
ViewportPortal 안에 그려 노드와 같은 flow 좌표계로 이동·확대된다. 선택·검색 강조와 구분되도록 점선과 다른 색을 쓴다.
인자 : DropIndicatorOverlayProps
반환값 : 놓일 자리 표시. 놓을 자리가 없으면 null
*/
export function DropIndicatorOverlay({ indicator }: DropIndicatorOverlayProps) {
  if (!indicator) return null;

  const { kind, rect } = indicator;

  return (
    <ViewportPortal>
      <div
        aria-hidden
        className={
          kind === "line"
            ? "pointer-events-none absolute top-0 left-0 rounded-full bg-indigo-500"
            : "pointer-events-none absolute top-0 left-0 rounded-lg border-2 border-dashed border-indigo-500"
        }
        style={{
          transform: `translate(${rect.x}px, ${rect.y}px)`,
          width: rect.width,
          height: rect.height,
        }}
      />
    </ViewportPortal>
  );
}
