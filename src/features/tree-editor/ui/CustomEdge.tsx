import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

const EDGE_STROKE_WIDTH = 1.5;
const EDGE_MARKER_SIZE = 12; // 화면 좌표 기준 화살촉 크기. 확대·축소와 함께 변한다.
const EDGE_CORNER_RADIUS = 16;
const EDGE_OFFSET = 20; // 노드에서 직선으로 빠져나온 뒤 꺾기 시작하는 거리

/*
함수 이름 : CustomEdge
기능 : 부모와 자식 노드를 둥근 직각 선으로 잇고 자식 쪽 끝에 열린 화살촉을 그린다. 색은 테마 값을 따른다.
형제 연결선이 줄기 하나를 공유해 곡선처럼 시작점에 뭉치지 않는다.
인자 : EdgeProps<CustomEditorEdge>
반환값 : 연결선과 화살촉 정의
*/
export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps<CustomEditorEdge>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: EDGE_CORNER_RADIUS,
    offset: EDGE_OFFSET,
  });

  const markerId = `edge-marker-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`; // 임시 노드 ID에 url()을 깨는 문자가 들어와도 참조가 유지되게 한다.

  /*
  마커는 10×10 좌표계를 늘려 그리므로, 윤곽선을 늘어난 만큼 줄여 화면에서 선과 같은 굵기로 보이게 한다.
  */
  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX={9}
          refY={5}
          markerWidth={EDGE_MARKER_SIZE}
          markerHeight={EDGE_MARKER_SIZE}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            className="custom-edge__marker"
            d="M2 1.5 L9 5 L2 8.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={(EDGE_STROKE_WIDTH * 10) / EDGE_MARKER_SIZE}
          />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{ strokeWidth: EDGE_STROKE_WIDTH, strokeLinecap: "round" }}
      />
    </>
  );
}
