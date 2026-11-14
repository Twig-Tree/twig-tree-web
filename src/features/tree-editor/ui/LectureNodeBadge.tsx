import {
  getLectureNodeBadge,
  useLectureAnimationStore,
} from "@/src/features/tree-editor/model/lecture/lectureAnimationStore";

type LectureBadgeTone = "accent" | "success" | "warning" | "danger";

/*
톤마다 테마가 글자 대비를 검사하는 바탕·글자 짝을 쓴다(app/themes/themes.test.ts의 textPairs).
영상에서 멀리서도 보이도록 모든 톤을 색이 꽉 찬 바탕으로 그린다.
*/
const BADGE_TONE_CLASS: Record<LectureBadgeTone, string> = {
  accent: "border-accent bg-accent text-on-accent",
  success: "border-success bg-success text-on-success",
  warning: "border-warning bg-warning text-on-warning",
  danger: "border-danger bg-danger text-on-danger",
};

/*
기호 하나(★, 1, O, X)는 글자보다 멀리서 읽혀야 하므로 크게 키워 동그란 꼬리표로 그린다. 글자가 여럿이면 알약 모양으로 둔다.
*/
const GLYPH_BADGE_CLASS =
  "flex h-9 min-w-9 items-center justify-center rounded-full border-2 px-1 text-xl leading-none font-extrabold";
const TEXT_BADGE_CLASS =
  "rounded-control border-2 px-2 py-0.5 text-sm leading-tight font-bold";

/*
함수 이름 : isGlyphBadgeLabel
기능 : 꼬리표 글자가 기호 하나인지 판단한다. 한 글자인지는 화면에 보이는 글자 단위로 센다.
인자 : string label -> 꼬리표 글자
반환값 : 기호 하나이면 true
*/
const isGlyphBadgeLabel = (label: string): boolean =>
  [...new Intl.Segmenter().segment(label)].length === 1;

type LectureNodeBadgeProps = {
  clientId: string; // 꼬리표를 찾을 노드의 clientId
};

/*
함수 이름 : LectureNodeBadge
기능 : 강의가 노드에 붙인 꼬리표를 노드 오른쪽 위 모서리에 띄운다. 꼬리표가 없으면 아무것도 그리지 않는다.
기호 하나는 동그란 꼬리표로, 글자가 여럿이면 알약 모양으로 그린다.
꼬리표가 바뀌면 key로 새로 그려 등장 애니메이션을 다시 실행한다.
인자 : LectureNodeBadgeProps
반환값 : 강의 꼬리표
*/
export function LectureNodeBadge({ clientId }: LectureNodeBadgeProps) {
  const badge = useLectureAnimationStore((state) =>
    getLectureNodeBadge(state, clientId),
  );

  if (badge === null) return null;

  const isGlyph = isGlyphBadgeLabel(badge.label);

  return (
    <span
      key={badge.id}
      className={`lecture-badge pointer-events-none absolute top-0 right-0 z-10 whitespace-nowrap shadow-control ${isGlyph ? GLYPH_BADGE_CLASS : TEXT_BADGE_CLASS} ${BADGE_TONE_CLASS[badge.tone]}`}
      data-tone={badge.tone}
      data-shape={isGlyph ? "glyph" : "text"}
    >
      {badge.label}
    </span>
  );
}
