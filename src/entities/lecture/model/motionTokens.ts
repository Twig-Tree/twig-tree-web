import { type ScenarioDelivery } from "./scenario/types";
import { type LectureHighlightAction } from "./types";

/*
semantic motion token. 모델이 고른 delivery 단어(pace, intensity, tone)를 대본의 구체 값으로 바꾸는 표다.
레시피와 컴파일러는 시간·배율·색을 직접 적지 않고 이 표에서 읽는다.

값은 지금 랩 프리셋과 데모 강의에서 쓰는 값의 분포를 기준으로 정했다. normal은 가장 흔한 값, quick과 slow는 그 양쪽이다.
테마마다 다른 값을 쓰는 일은 아직 없어 테마별로 나누지 않는다. 색은 대본의 tone을 CSS가 테마 토큰으로 해석한다.
*/

export type LecturePace = NonNullable<ScenarioDelivery["pace"]>;
export type LectureIntensity = NonNullable<ScenarioDelivery["intensity"]>;
export type LectureSemanticTone = NonNullable<ScenarioDelivery["tone"]>;

/*
시간을 쓰는 자리. 같은 pace라도 자리마다 알맞은 길이가 달라 따로 둔다.
- camera: focus가 화면을 옮기는 시간
- emphasis: 강조·흐림·동시 추적이 보이는 시간
- pause: wait가 쉬는 시간
- traceSegment: 순차 추적이 연결선 하나를 그리는 시간
- layoutHold: 접고 펼친 뒤 다음 동작까지 기다리는 시간. 노드 전환(800ms)보다 짧으면 전환 도중에 다음 동작이 시작한다
*/
export type LectureDurationSlot =
  | "camera"
  | "emphasis"
  | "pause"
  | "traceSegment"
  | "layoutHold";

export const LECTURE_DURATION_TOKENS: Record<
  LectureDurationSlot,
  Record<LecturePace, number>
> = {
  camera: { quick: 600, normal: 700, slow: 900 },
  emphasis: { quick: 800, normal: 1200, slow: 1800 },
  pause: { quick: 300, normal: 450, slow: 700 },
  traceSegment: { quick: 450, normal: 650, slow: 900 },
  layoutHold: { quick: 800, normal: 850, slow: 1050 },
};

/*
움직임의 곡선. CSS timing function 문자열이라 렌더러가 그대로 쓴다.
- enter: 나타날 때. 빠르게 시작해 부드럽게 멈춘다
- move: 자리를 옮기거나 반복할 때
- exit: 사라질 때. 천천히 시작해 빠르게 끝난다
*/
export type LectureEasingToken = "enter" | "move" | "exit";

export const LECTURE_EASING_TOKENS: Record<LectureEasingToken, string> = {
  enter: "ease-out",
  move: "ease-in-out",
  exit: "ease-in",
};

/*
강도가 바꾸는 값. 강조의 움직임과 focus의 확대 배율이 함께 세진다.
bounce와 shake는 강도가 아니라 의미(주의, 오답 등)를 나타내므로 레시피가 직접 고른다.
*/
export type LectureIntensityToken = {
  highlightStyle: LectureHighlightAction["style"];
  focusMaxZoom: number;
};

export const LECTURE_INTENSITY_TOKENS: Record<
  LectureIntensity,
  LectureIntensityToken
> = {
  subtle: { highlightStyle: "steady", focusMaxZoom: 1 },
  medium: { highlightStyle: "pulse", focusMaxZoom: 1.2 },
  strong: { highlightStyle: "pop", focusMaxZoom: 1.4 },
};

/*
시나리오의 tone을 대본 highlight의 tone으로 바꾼다. 색 값은 CSS가 테마 토큰으로 정한다.
neutral은 강조 색을 쓰지 않는다는 뜻이라 대응하는 tone이 없다. 레시피는 neutral일 때 강조 대신 다른 동작을 고른다.
*/
export const LECTURE_TONE_TOKENS: Record<
  LectureSemanticTone,
  NonNullable<LectureHighlightAction["tone"]> | null
> = {
  neutral: null,
  accent: "accent",
  positive: "success",
  warning: "warning",
  danger: "danger",
};
