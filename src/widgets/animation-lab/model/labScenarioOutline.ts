import {
  getLectureMotion,
  getResolvedDelivery,
  type LectureAnimation,
  type LectureBeat,
  type LectureCompileSource,
  type LectureCompileSourceMap,
  type LectureMotion,
  type LectureScenario,
  type LectureScript,
  type ResolvedDelivery,
  type ScenarioCue,
  type ScenarioDelivery,
} from "@/src/entities/lecture";

/*
cue가 실제로 쓴 전달 방식. 컴파일러와 같은 함수로 계산해, 모델이 고른 값과 intent 기본값으로 채운 값을 구분해 보여 준다.
*/
export type LabOutlineCueDelivery = {
  delivery: ResolvedDelivery; // intent 기본값으로 채운 delivery
  cueFields: (keyof ScenarioDelivery)[]; // 시나리오의 cue가 직접 고른 필드
  motion: LectureMotion; // delivery를 motion token으로 바꾼 값
};

/*
컴파일 결과를 장면 → 비트 → 출처(cue 또는 컴파일러) → 동작 순서로 펼친 모양.
source map의 animationPath로 비트 animation 안에서 출처별 동작을 찾아 붙인다.
*/
export type LabOutlineSource = {
  key: string; // 비트 안에서 고유한 키
  source: LectureCompileSource;
  animation: LectureAnimation; // 이 출처가 만든 동작
  cueDelivery: LabOutlineCueDelivery | null; // 컴파일러가 넣은 동작이면 null
};

export type LabOutlineBeat = {
  beat: LectureBeat;
  sources: LabOutlineSource[];
};

export type LabOutlineScene = {
  id: string;
  nodeId: string;
  beats: LabOutlineBeat[];
};

/*
함수 이름 : getAnimationAtPath
기능 : 비트 animation 안에서 source map이 가리키는 위치의 동작을 찾는다.
인자 : LectureAnimation animation -> 비트 animation
PropertyKey[] path -> source map의 animationPath. 예: ["children", 1]
반환값 : 그 위치의 동작. 경로가 맞지 않으면 null
*/
const getAnimationAtPath = (
  animation: LectureAnimation,
  path: PropertyKey[],
): LectureAnimation | null => {
  let current: unknown = animation;

  for (const key of path) {
    if (typeof current !== "object" || current === null) return null;
    current = (current as Record<PropertyKey, unknown>)[key];
  }

  /*
  경로가 ["children"]처럼 그룹의 자식 배열을 가리키면 객체여도 동작이 아니다. 동작과 그룹은 모두 type을 가진다.
  */
  return typeof current === "object" &&
    current !== null &&
    !Array.isArray(current) &&
    typeof (current as { type?: unknown }).type === "string"
    ? (current as LectureAnimation)
    : null;
};

/*
함수 이름 : getCueDelivery
기능 : cue의 delivery를 intent 기본값으로 채우고 motion token으로 바꾼다.
인자 : ScenarioCue cue -> 시나리오 cue
반환값 : 채운 delivery, cue가 고른 필드, motion
*/
const getCueDelivery = ({
  intent,
  delivery,
}: ScenarioCue): LabOutlineCueDelivery => ({
  delivery: getResolvedDelivery(intent, delivery),
  cueFields: (Object.keys(delivery ?? {}) as (keyof ScenarioDelivery)[]).filter(
    (field) => delivery?.[field] !== undefined,
  ),
  motion: getLectureMotion(intent, delivery),
});

/*
함수 이름 : getLabScenarioOutline
기능 : 대본과 source map으로 장면 → 비트 → 출처 → 동작 트리를 만든다.
source map이 가리키는 위치에 동작이 없으면 컴파일러와 source map이 어긋난 버그이므로 예외로 알린다.
인자 : LectureScript script -> 컴파일한 대본
LectureCompileSourceMap sourceMap -> beat ID별 동작 출처
LectureScenario scenario -> 컴파일한 시나리오. cue의 delivery를 읽는다
반환값 : 장면별 비트와 출처 목록
*/
export const getLabScenarioOutline = (
  script: LectureScript,
  sourceMap: LectureCompileSourceMap,
  scenario: LectureScenario,
): LabOutlineScene[] => {
  /*
  beat ID는 시나리오 전체에서 고유하고 대본도 같은 ID를 쓴다(LectureCompileSourceMap).
  */
  const cuesByBeatId = new Map(
    scenario.scenes.flatMap(({ beats }) =>
      beats.map((beat) => [beat.id, beat.cues] as const),
    ),
  );

  return script.scenes.map(({ id, nodeId, beats }) => ({
    id,
    nodeId,
    beats: beats.map((beat) => ({
      beat,
      sources: (sourceMap[beat.id] ?? []).map(
        ({ animationPath, source }, index) => {
          const animation = getAnimationAtPath(beat.animation, animationPath);

          if (animation === null) {
            throw new Error(
              `비트 ${beat.id}의 source map 위치 ${animationPath.map(String).join(".")}에 동작이 없습니다.`,
            );
          }

          const cue =
            source.type === "cue"
              ? cuesByBeatId.get(beat.id)?.[source.cueIndex]
              : undefined;

          return {
            key: `${index}`,
            source,
            animation,
            cueDelivery: cue ? getCueDelivery(cue) : null,
          };
        },
      ),
    })),
  }));
};
