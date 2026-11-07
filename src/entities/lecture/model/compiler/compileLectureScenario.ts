import { type LectureRecipeRegistryVersion } from "../recipes/registry";
import { lectureScenarioSchema } from "../scenario/schema";
import { type ScenarioBeat } from "../scenario/types";
import { type LectureAnimation, type LectureBeat } from "../types";
import {
  getBeatTimingIssues,
  getMissingRoleNodeIssues,
  getSceneCompositionIssues,
} from "./compileChecks";
import { getCueRecipeAnimation } from "./intentRecipes";
import { getLectureNarration } from "./narration";
import {
  type LectureCompileIssue,
  type LectureCompileResult,
  type LectureCompilerTree,
  type LectureSourceMapEntry,
} from "./types";

type CompileLectureScenarioOptions = {
  scriptId: string; // 만들 대본의 ID. 시나리오에는 ID가 없어 부르는 쪽이 정한다
  tree: LectureCompilerTree;
};

type CompiledBeat = {
  beat: LectureBeat;
  sourceMap: LectureSourceMapEntry[];
  issues: LectureCompileIssue[];
};

/*
함수 이름 : compileBeat
기능 : 비트의 cue를 차례로 recipe로 실행해 순차 그룹으로 잇는다.
cue 하나면 그 애니메이션을 그대로 쓰고, cue가 없으면 길이 0인 wait을 넣는다.
인자 : ScenarioBeat beat -> 시나리오 비트
PropertyKey[] beatPath -> 시나리오 안의 비트 위치
LectureRecipeRegistryVersion version -> recipe registry 버전
LectureCompilerTree tree -> 트리 조회 함수
반환값 : 대본 비트와 source map, cue 위치별 문제
*/
const compileBeat = (
  beat: ScenarioBeat,
  beatPath: PropertyKey[],
  version: LectureRecipeRegistryVersion,
  tree: LectureCompilerTree,
): CompiledBeat => {
  const narration = getLectureNarration(beat.narration);

  if (beat.cues.length === 0) {
    return {
      beat: {
        id: beat.id,
        narration,
        animation: { type: "wait", durationMs: 0 },
      },
      sourceMap: [
        {
          animationPath: [],
          source: { type: "compiler", reason: "empty-beat" },
        },
      ],
      issues: [],
    };
  }

  const animations: LectureAnimation[] = [];
  const sourceMap: LectureSourceMapEntry[] = [];
  const issues: LectureCompileIssue[] = [];
  const isSingleCue = beat.cues.length === 1;

  beat.cues.forEach((cue, cueIndex) => {
    const cuePath = [...beatPath, "cues", cueIndex];

    /*
    없는 노드로 recipe를 실행하면 "자식이 없음"처럼 원인과 다른 실패가 나므로 노드 확인을 먼저 한다.
    */
    const missingNodeIssues = getMissingRoleNodeIssues(cue, cuePath, tree);

    if (missingNodeIssues.length > 0) {
      issues.push(...missingNodeIssues);
      return;
    }

    const result = getCueRecipeAnimation(cue, version, tree);

    if (!result.success) {
      issues.push(
        ...result.issues.map(({ path, message }) => ({
          severity: "error" as const,
          stage: "recipe" as const,
          path: [...cuePath, ...path],
          message,
        })),
      );
      return;
    }

    sourceMap.push({
      animationPath: isSingleCue ? [] : ["children", cueIndex],
      source: {
        type: "cue",
        cueIndex,
        intent: cue.intent,
        recipeId: result.recipeId,
      },
    });
    animations.push(result.animation);
  });

  return {
    beat: {
      id: beat.id,
      narration,
      animation: isSingleCue
        ? animations[0]
        : { type: "group", mode: "sequence", children: animations },
    },
    sourceMap,
    issues,
  };
};

/*
함수 이름 : compileLectureScenario
기능 : 외부 모델이 만든 시나리오를 검사하고 플레이어가 재생하는 대본으로 바꾼다.
같은 시나리오, 같은 트리, 같은 recipe registry 버전이면 같은 대본을 만든다.
한 cue가 실패해도 나머지를 계속 컴파일해 모든 문제를 한 번에 보고한다.
인자 : unknown input -> 모델 출력처럼 아직 검사하지 않은 시나리오
CompileLectureScenarioOptions options -> 대본 ID와 트리 조회 함수
반환값 : 대본과 source map, 또는 시나리오 위치별 문제
*/
export const compileLectureScenario = (
  input: unknown,
  { scriptId, tree }: CompileLectureScenarioOptions,
): LectureCompileResult => {
  const parsed = lectureScenarioSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map(({ path, message }) => ({
        severity: "error",
        stage: "schema",
        path,
        message,
      })),
    };
  }

  const scenario = parsed.data;
  const issues: LectureCompileIssue[] = [];
  const sourceMapEntries: [string, LectureSourceMapEntry[]][] = [];

  const scenes = scenario.scenes.map((scene, sceneIndex) => {
    const scenePath = ["scenes", sceneIndex];

    if (!tree.hasNode(scene.nodeId)) {
      issues.push({
        severity: "error",
        stage: "node",
        path: [...scenePath, "nodeId"],
        message: `트리에 없는 노드(${scene.nodeId})입니다.`,
      });
    }

    const compiledBeats = scene.beats.map((beat, beatIndex) => ({
      ...compileBeat(
        beat,
        [...scenePath, "beats", beatIndex],
        scenario.recipeRegistryVersion,
        tree,
      ),
      beatPath: [...scenePath, "beats", beatIndex],
    }));

    for (const compiled of compiledBeats) {
      issues.push(...compiled.issues);
      sourceMapEntries.push([compiled.beat.id, compiled.sourceMap]);
    }

    /*
    실패한 cue가 있으면 비트 애니메이션이 빠져 있어, 조합과 시간 검사가 엉뚱한 문제를 낼 수 있다. 장면 단위로 건너뛴다.
    */
    if (compiledBeats.every((compiled) => compiled.issues.length === 0)) {
      issues.push(
        ...getSceneCompositionIssues(compiledBeats),
        ...compiledBeats.flatMap(({ beat, beatPath }) =>
          getBeatTimingIssues(beat, beatPath),
        ),
      );
    }

    return {
      id: scene.id,
      nodeId: scene.nodeId,
      beats: compiledBeats.map(({ beat }) => beat),
    };
  });

  if (issues.some(({ severity }) => severity === "error")) {
    return { success: false, issues };
  }

  return {
    success: true,
    script: { id: scriptId, title: scenario.title, scenes },
    /*
    beat ID는 모델이 정하므로 "__proto__"도 올 수 있다. 대입은 이 키를 자체 속성으로 만들지 않아,
    자체 속성으로 정의하는 Object.fromEntries로 만든다.
    */
    sourceMap: Object.fromEntries(sourceMapEntries),
    warnings: issues,
  };
};
