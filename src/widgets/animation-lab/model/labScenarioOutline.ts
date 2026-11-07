import {
  type LectureAnimation,
  type LectureBeat,
  type LectureCompileSource,
  type LectureCompileSourceMap,
  type LectureScript,
} from "@/src/entities/lecture";

/*
컴파일 결과를 장면 → 비트 → 출처(cue 또는 컴파일러) → 동작 순서로 펼친 모양.
source map의 animationPath로 비트 animation 안에서 출처별 동작을 찾아 붙인다.
*/
export type LabOutlineSource = {
  key: string; // 비트 안에서 고유한 키
  source: LectureCompileSource;
  animation: LectureAnimation; // 이 출처가 만든 동작
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

  return typeof current === "object" && current !== null
    ? (current as LectureAnimation)
    : null;
};

/*
함수 이름 : getLabScenarioOutline
기능 : 대본과 source map으로 장면 → 비트 → 출처 → 동작 트리를 만든다.
source map이 가리키는 위치에 동작이 없으면 컴파일러와 source map이 어긋난 버그이므로 예외로 알린다.
인자 : LectureScript script -> 컴파일한 대본
LectureCompileSourceMap sourceMap -> beat ID별 동작 출처
반환값 : 장면별 비트와 출처 목록
*/
export const getLabScenarioOutline = (
  script: LectureScript,
  sourceMap: LectureCompileSourceMap,
): LabOutlineScene[] =>
  script.scenes.map(({ id, nodeId, beats }) => ({
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

          return { key: `${index}`, source, animation };
        },
      ),
    })),
  }));
