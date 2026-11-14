import { CustomEditorEdge } from "@/src/features/tree-editor/model/types";
import {
  getLectureEdgeTraceDirection,
  getLectureEdgeTraceStyle,
  getLectureNodeGrowState,
  isLectureEdgeDimmed,
  useLectureAnimationStore,
} from "@/src/features/tree-editor/model/lecture/lectureAnimationStore";
import { useTheme, type ThemeId } from "@/src/shared/lib/theme";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

const EDGE_STROKE_WIDTH = 1.5;
const EDGE_MARKER_SIZE = 12; // 화면 좌표 기준 화살촉 크기. 확대·축소와 함께 변한다.

type EdgePathConfig = {
  borderRadius: number; // 꺾이는 곳의 곡률
  offset: number; // 노드에서 직선으로 빠져나온 뒤 꺾기 시작하는 거리
};

/*
경로는 좌표를 계산해 만들므로 CSS 토큰으로 정할 수 없어 테마별 값을 여기에 둔다.
새 테마를 추가하면 타입 검사가 이 목록의 빈자리를 알려 준다.
*/
const EDGE_PATH_BY_THEME: Record<ThemeId, EdgePathConfig> = {
  neutral: { borderRadius: 16, offset: 20 },
  soft: { borderRadius: 16, offset: 20 },
  dark: { borderRadius: 16, offset: 20 },
};

/*
함수 이름 : CustomEdge
기능 : 부모와 자식 노드를 둥근 직각 선으로 잇고 자식 쪽 끝에 화살촉을 그린다. 경로, 색, 화살촉 채움은 테마 값을 따른다.
형제 연결선이 줄기 하나를 공유해 곡선처럼 시작점에 뭉치지 않는다.
인자 : EdgeProps<CustomEditorEdge>
반환값 : 연결선과 화살촉 정의
*/
export function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
}: EdgeProps<CustomEditorEdge>) {
  const { theme } = useTheme();
  const traceDirection = useLectureAnimationStore((state) =>
    getLectureEdgeTraceDirection(state, source, target),
  );
  const traceStyle = useLectureAnimationStore((state) =>
    getLectureEdgeTraceStyle(state, source, target),
  );
  const growState = useLectureAnimationStore((state) =>
    getLectureNodeGrowState(state, target),
  ); // 연결선은 자식 노드와 함께 숨고 나타난다
  const isDimmed = useLectureAnimationStore((state) =>
    isLectureEdgeDimmed(state, source, target),
  );
  const isTraced = traceDirection !== null;
  const isCometTraced = isTraced && traceStyle === "comet";
  /*
  추적 중인 연결선은 그려 나가는 등장 효과를 건너뛴다. 등장 규칙의 dash가 추적 점선과 흐름을 덮어쓰기 때문이다.
  숨김은 그대로 따라야 아직 나타나지 않은 자식에게 선이 먼저 닿지 않는다.
  */
  const edgeGrowState = growState === "entering" && isTraced ? null : growState;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    ...EDGE_PATH_BY_THEME[theme],
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
        /*
        인라인 굵기가 있으면 클래스의 추적 굵기가 적용되지 않으므로 추적 중에는 클래스에 맡긴다.
        */
        style={
          isTraced && !isCometTraced
            ? style
            : {
                ...style,
                strokeWidth: EDGE_STROKE_WIDTH,
                strokeLinecap: "round",
              }
        }
        /*
        자라며 나타나는 연결선은 길이를 1로 정규화해 길이와 관계없이 같은 CSS 값으로 그려 나간다.
        */
        pathLength={edgeGrowState === "entering" ? 1 : undefined}
        className={
          [
            isTraced && !isCometTraced
              ? `lecture-edge-traced lecture-edge-traced-${traceDirection}`
              : null,
            isDimmed ? "lecture-edge-dimmed" : null,
            edgeGrowState === null
              ? null
              : `lecture-edge-grow-${edgeGrowState}`,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {isCometTraced ? (
        <LectureCometTrace path={edgePath} direction={traceDirection} />
      ) : null}
    </>
  );
}

type LectureCometTraceProps = {
  path: string; // 연결선 경로
  direction: "forward" | "reverse"; // 부모 → 자식(forward)으로 달릴지, 자식 → 부모(reverse)로 달릴지
};

/*
함수 이름 : LectureCometTrace
기능 : 추적 중인 연결선 위에 빛나는 선을 그려 나간 뒤, 빛 점과 꼬리가 선을 따라 반복해 달리게 한다.
기본 연결선은 그대로 두고 위에 덧그려, 추적이 끝나면 덧그린 것만 사라진다.
pathLength를 1로 정규화해 선 길이와 관계없이 같은 CSS 값으로 그리기와 꼬리 길이를 정한다.
인자 : LectureCometTraceProps
반환값 : 혜성 추적 선, 꼬리, 빛 점
*/
function LectureCometTrace({ path, direction }: LectureCometTraceProps) {
  return (
    <g
      className={`lecture-comet lecture-comet-${direction}`}
      pointerEvents="none"
    >
      <path className="lecture-comet__line" d={path} pathLength={1} />
      <path className="lecture-comet__tail" d={path} pathLength={1} />
      <circle
        className="lecture-comet__head"
        r={4}
        style={{ offsetPath: `path("${path}")` }}
      />
    </g>
  );
}
