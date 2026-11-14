import {
  getLectureNodeBadge,
  useLectureAnimationStore,
} from "@/src/features/tree-editor/model/lecture/lectureAnimationStore";

type LectureBadgeTone = "accent" | "success" | "warning" | "danger";

/*
톤마다 테마가 글자 대비를 검사하는 바탕·글자 짝을 쓴다(app/themes/themes.test.ts의 textPairs).
*/
const BADGE_TONE_CLASS: Record<LectureBadgeTone, string> = {
  accent: "border-accent bg-accent text-on-accent",
  success: "border-success bg-success-subtle text-success",
  warning: "border-warning bg-warning-subtle text-warning-strong",
  danger: "border-danger bg-danger-subtle text-danger",
};

type LectureNodeBadgeProps = {
  clientId: string; // 꼬리표를 찾을 노드의 clientId
};

/*
함수 이름 : LectureNodeBadge
기능 : 강의가 노드에 붙인 꼬리표를 노드 오른쪽 위 모서리에 띄운다. 꼬리표가 없으면 아무것도 그리지 않는다.
꼬리표가 바뀌면 key로 새로 그려 등장 애니메이션을 다시 실행한다.
인자 : LectureNodeBadgeProps
반환값 : 강의 꼬리표
*/
export function LectureNodeBadge({ clientId }: LectureNodeBadgeProps) {
  const badge = useLectureAnimationStore((state) =>
    getLectureNodeBadge(state, clientId),
  );

  if (badge === null) return null;

  return (
    <span
      key={badge.id}
      className={`lecture-badge pointer-events-none absolute top-0 right-0 z-10 rounded-control border-2 px-2 py-0.5 text-xs leading-tight font-bold whitespace-nowrap shadow-control ${BADGE_TONE_CLASS[badge.tone]}`}
      data-tone={badge.tone}
    >
      {badge.label}
    </span>
  );
}
