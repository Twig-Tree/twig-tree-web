import { LECTURE_INTENT_RECIPES } from "../compiler/intentRecipes";
import { type LectureCompileSourceMap } from "../compiler/types";
import { getLectureIssuePathText } from "../generation/repairRequest";
import { type LectureRecipeId } from "../recipes/registry";
import { type LectureScenario, type SemanticIntent } from "../scenario/types";

/*
컴파일 문제 하나가 가리키는 곳. scenario 위치 → beat ID·cue 순번·intent·recipe ID → animation 경로 순으로 잇는다.
위치가 비트나 cue까지 내려가지 않으면 그 아래 값은 null이다.
*/
export type LectureIssueLocation = {
  path: string; // 시나리오 안의 위치. 예: $.scenes[0].beats[1].cues[0].roles.subject
  sceneId: string | null;
  beatId: string | null; // 대본의 beat ID와 같다
  cueIndex: number | null; // 비트 안의 cue 순번
  intent: SemanticIntent | null;
  recipeId: LectureRecipeId | null; // intent를 실행한 recipe
  animationPaths: string[]; // 이 cue가 만든 비트 animation 안의 위치. source map이 없으면(컴파일 실패) 비어 있다
};

/*
함수 이름 : getLectureIssueLocation
기능 : 시나리오 위치를 장면·비트·cue와 그 cue가 만든 animation 위치로 풀어 쓴다.
인자 : PropertyKey[] path -> 시나리오 안의 위치
LectureScenario | null scenario -> 스키마를 통과한 시나리오. 통과하지 못했으면 null
LectureCompileSourceMap | null sourceMap -> 컴파일에 성공했을 때의 source map
반환값 : 문제 위치
*/
export const getLectureIssueLocation = (
  path: PropertyKey[],
  scenario: LectureScenario | null,
  sourceMap: LectureCompileSourceMap | null,
): LectureIssueLocation => {
  const [, sceneIndex, , beatIndex, , cueIndex] = path;
  const scene =
    path[0] === "scenes" && typeof sceneIndex === "number"
      ? scenario?.scenes[sceneIndex]
      : undefined;
  const beat =
    path[2] === "beats" && typeof beatIndex === "number"
      ? scene?.beats[beatIndex]
      : undefined;
  const cue =
    path[4] === "cues" && typeof cueIndex === "number"
      ? beat?.cues[cueIndex]
      : undefined;
  const recipeId =
    cue && scenario
      ? LECTURE_INTENT_RECIPES[scenario.recipeRegistryVersion][cue.intent]
          .recipeId
      : null;
  const animationPaths =
    beat && cue && sourceMap
      ? (sourceMap[beat.id] ?? [])
          .filter(
            ({ source }) =>
              source.type === "cue" && source.cueIndex === cueIndex,
          )
          .map(({ animationPath }) =>
            getLectureIssuePathText(["animation", ...animationPath]),
          )
      : [];

  return {
    path: getLectureIssuePathText(path),
    sceneId: scene?.id ?? null,
    beatId: beat?.id ?? null,
    cueIndex: cue ? (cueIndex as number) : null,
    intent: cue?.intent ?? null,
    recipeId,
    animationPaths,
  };
};
