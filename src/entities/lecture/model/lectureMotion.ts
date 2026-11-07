import {
  LECTURE_DURATION_TOKENS,
  LECTURE_INTENSITY_TOKENS,
  LECTURE_TONE_TOKENS,
  type LectureDurationSlot,
  type LectureIntensityToken,
} from "./motionTokens";
import { type ScenarioDelivery, type SemanticIntent } from "./scenario/types";
import { type LectureHighlightAction } from "./types";

export type ResolvedDelivery = Required<ScenarioDelivery>;

/*
intent마다 모델이 delivery를 비웠을 때 쓰는 값. 같은 단어라도 의도에 따라 알맞은 분위기가 달라 스키마가 아니라 여기서 채운다.
- 경고·오답처럼 놓치면 안 되는 의도는 strong, 장면을 넘기는 transition은 quick·subtle로 둔다
- 정답은 positive, 경고는 warning, 오답은 danger로 의미 색을 쓴다
- transition은 화면만 옮기므로 강조 색이 없는 neutral이다
Record로 두어 intent를 추가하고 기본값을 빠뜨리면 타입 오류가 난다.
*/
export const LECTURE_INTENT_DELIVERY_DEFAULTS: Record<
  SemanticIntent,
  ResolvedDelivery
> = {
  introduce: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  emphasize: {
    pace: "normal",
    intensity: "strong",
    tone: "accent",
    continuity: "transient",
  },
  compare: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  decompose: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  trace: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  reveal: {
    pace: "normal",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
  warn: {
    pace: "normal",
    intensity: "strong",
    tone: "warning",
    continuity: "transient",
  },
  correct: {
    pace: "normal",
    intensity: "medium",
    tone: "positive",
    continuity: "transient",
  },
  incorrect: {
    pace: "normal",
    intensity: "strong",
    tone: "danger",
    continuity: "transient",
  },
  transition: {
    pace: "quick",
    intensity: "subtle",
    tone: "neutral",
    continuity: "transient",
  },
  recap: {
    pace: "quick",
    intensity: "subtle",
    tone: "accent",
    continuity: "transient",
  },
  summarize: {
    pace: "slow",
    intensity: "medium",
    tone: "accent",
    continuity: "transient",
  },
};

/*
레시피가 대본을 만들 때 읽는 구체 값. 시간은 자리마다 하나씩 고른 값이다.
*/
export type LectureMotion = LectureIntensityToken & {
  durationMs: Record<LectureDurationSlot, number>;
  highlightTone: NonNullable<LectureHighlightAction["tone"]> | null; // null이면 강조 색을 쓰지 않는다
  persist: boolean; // 효과를 다음 비트까지 남길지. 유지할 수 있는 동작에만 붙인다
};

/*
함수 이름 : getDeliveryWithDefaults
기능 : delivery에서 빠진 값을 주어진 기본값으로 채운다.
인자 : ResolvedDelivery defaults -> 빠진 값에 쓸 기본값
ScenarioDelivery | undefined delivery -> 고른 전달 방식
반환값 : 모든 값이 채워진 delivery
*/
export const getDeliveryWithDefaults = (
  defaults: ResolvedDelivery,
  delivery: ScenarioDelivery | undefined,
): ResolvedDelivery => {
  /*
  스프레드로 합치면 delivery에 undefined로 들어온 값이 기본값을 지워 필드마다 고른다.
  */
  return {
    pace: delivery?.pace ?? defaults.pace,
    intensity: delivery?.intensity ?? defaults.intensity,
    tone: delivery?.tone ?? defaults.tone,
    continuity: delivery?.continuity ?? defaults.continuity,
  };
};

/*
함수 이름 : getResolvedDelivery
기능 : cue의 delivery에서 빠진 값을 intent의 기본값으로 채운다.
인자 : SemanticIntent intent -> cue의 intent
ScenarioDelivery | undefined delivery -> 모델이 고른 전달 방식
반환값 : 모든 값이 채워진 delivery
*/
export const getResolvedDelivery = (
  intent: SemanticIntent,
  delivery: ScenarioDelivery | undefined,
): ResolvedDelivery =>
  getDeliveryWithDefaults(LECTURE_INTENT_DELIVERY_DEFAULTS[intent], delivery);

/*
함수 이름 : getLectureMotionFromDelivery
기능 : 모두 채워진 delivery를 motion token 표에서 찾아 대본에 넣을 구체 값으로 바꾼다.
인자 : ResolvedDelivery delivery -> 모든 값이 채워진 전달 방식
반환값 : 자리별 시간, 강조 스타일과 색, focus 배율, 유지 여부
*/
export const getLectureMotionFromDelivery = ({
  pace,
  intensity,
  tone,
  continuity,
}: ResolvedDelivery): LectureMotion => {
  const durationMs = Object.fromEntries(
    Object.entries(LECTURE_DURATION_TOKENS).map(([slot, byPace]) => [
      slot,
      byPace[pace],
    ]),
  ) as Record<LectureDurationSlot, number>;

  return {
    ...LECTURE_INTENSITY_TOKENS[intensity],
    durationMs,
    highlightTone: LECTURE_TONE_TOKENS[tone],
    persist: continuity === "persist",
  };
};

/*
함수 이름 : getLectureMotion
기능 : cue의 intent와 delivery를 motion token 표에서 찾아 대본에 넣을 구체 값으로 바꾼다.
인자 : SemanticIntent intent -> cue의 intent
ScenarioDelivery | undefined delivery -> 모델이 고른 전달 방식
반환값 : 자리별 시간, 강조 스타일과 색, focus 배율, 유지 여부
*/
export const getLectureMotion = (
  intent: SemanticIntent,
  delivery: ScenarioDelivery | undefined,
): LectureMotion =>
  getLectureMotionFromDelivery(getResolvedDelivery(intent, delivery));
