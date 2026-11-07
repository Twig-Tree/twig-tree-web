import {
  getAnimationCompositionIssues,
  getAnimationDurationMs,
  isCameraAction,
} from "../recipes/getAnimationCompositionIssues";
import { type ScenarioCue } from "../scenario/types";
import { type LectureAnimation, type LectureBeat } from "../types";
import {
  type LectureCompileIssue,
  type LectureCompilerTree,
  type LectureSourceMapEntry,
} from "./types";

/*
비트 하나가 이보다 길면 경고한다. 한 비트는 문장 하나와 그에 맞는 연출이라, 길어지면 내레이션과 화면이 어긋나 보인다.
*/
export const MAX_BEAT_DURATION_MS = 20_000;

/*
비트 하나에서 카메라가 이보다 많이 움직이면 경고한다. 버전 1 recipe는 cue 하나에 카메라를 많아야 한 번 움직이므로,
카메라를 옮기는 cue를 넷 이상 이어 붙인 비트가 여기에 걸린다.
*/
export const MAX_BEAT_CAMERA_MOVES = 3;

/*
함수 이름 : getMissingRoleNodeIssues
기능 : cue의 role이 가리키는 노드 중 트리에 없는 노드를 찾는다.
인자 : ScenarioCue cue -> 검사할 cue
PropertyKey[] cuePath -> 시나리오 안의 cue 위치
LectureCompilerTree tree -> 트리 조회 함수
반환값 : 없는 노드마다 문제 하나
*/
export const getMissingRoleNodeIssues = (
  cue: ScenarioCue,
  cuePath: PropertyKey[],
  tree: LectureCompilerTree,
): LectureCompileIssue[] => {
  const roles: Record<string, string | string[] | undefined> = cue.roles;

  return Object.entries(roles).flatMap(([roleName, value]) => {
    if (value === undefined) return [];

    const entries: [string, PropertyKey[]][] = Array.isArray(value)
      ? value.map((nodeId, index) => [nodeId, [roleName, index]])
      : [[value, [roleName]]];

    return entries
      .filter(([nodeId]) => !tree.hasNode(nodeId))
      .map(([nodeId, rolePath]) => ({
        severity: "error" as const,
        stage: "node" as const,
        path: [...cuePath, "roles", ...rolePath],
        message: `트리에 없는 노드(${nodeId})입니다.`,
      }));
  });
};

const isPathPrefix = (prefix: PropertyKey[], path: PropertyKey[]): boolean =>
  prefix.length <= path.length &&
  prefix.every((key, index) => path[index] === key);

type CompiledSceneBeat = {
  beat: LectureBeat;
  beatPath: PropertyKey[]; // 시나리오 안의 비트 위치
  sourceMap: LectureSourceMapEntry[];
};

/*
함수 이름 : getSceneCompositionIssues
기능 : 장면의 비트들을 이어 동작끼리 함께 실행될 수 있는지 검사하고, 문제를 만든 cue의 위치로 옮긴다.
persist 효과는 같은 장면의 다음 비트까지 남으므로 비트가 아니라 장면 단위로 본다.
장면이 끝나면 플레이어가 persist 효과를 지우므로 끝까지 남는 persist는 문제로 보지 않는다.
인자 : CompiledSceneBeat[] beats -> 장면의 컴파일한 비트
반환값 : cue 위치별 문제. 비트 전체에 걸친 문제면 비트 위치
*/
export const getSceneCompositionIssues = (
  beats: CompiledSceneBeat[],
): LectureCompileIssue[] => {
  const sceneAnimation: LectureAnimation = {
    type: "group",
    mode: "sequence",
    children: beats.map(({ beat }) => beat.animation),
  };

  return getAnimationCompositionIssues(sceneAnimation, {
    allowLingeringPersist: true,
  }).map(({ path, message }) => {
    /*
    장면 animation의 위치는 ["children", 비트 순번, ...비트 animation 안의 위치]다.
    */
    const [, beatIndex, ...animationPath] = path;
    const { beatPath, sourceMap } = beats[beatIndex as number];
    const entry = sourceMap.find(({ animationPath: prefix }) =>
      isPathPrefix(prefix, animationPath),
    );

    return {
      severity: "error",
      stage: "composition",
      path:
        entry?.source.type === "cue"
          ? [...beatPath, "cues", entry.source.cueIndex]
          : beatPath,
      message,
    };
  });
};

const countCameraActions = (animation: LectureAnimation): number =>
  animation.type === "group"
    ? animation.children.reduce(
        (count, child) => count + countCameraActions(child),
        0,
      )
    : Number(isCameraAction(animation));

/*
함수 이름 : getBeatTimingIssues
기능 : 비트가 너무 길거나 카메라를 너무 자주 움직이는지 검사한다. 재생은 할 수 있으므로 경고로 보고한다.
비트 길이는 내레이션과 애니메이션 중 긴 쪽이다. 플레이어가 둘 다 끝나야 다음 비트로 넘어간다.
인자 : LectureBeat beat -> 컴파일한 비트
PropertyKey[] beatPath -> 시나리오 안의 비트 위치
반환값 : 경고 목록
*/
export const getBeatTimingIssues = (
  beat: LectureBeat,
  beatPath: PropertyKey[],
): LectureCompileIssue[] => {
  const issues: LectureCompileIssue[] = [];
  const narrationMs = beat.narration.fallbackDurationMs;
  const animationMs = getAnimationDurationMs(beat.animation);

  if (Math.max(narrationMs, animationMs) > MAX_BEAT_DURATION_MS) {
    issues.push({
      severity: "warning",
      stage: "duration",
      path: beatPath,
      message: `비트가 ${MAX_BEAT_DURATION_MS}ms보다 깁니다(내레이션 ${narrationMs}ms, 애니메이션 ${animationMs}ms).`,
    });
  }

  const cameraMoves = countCameraActions(beat.animation);

  if (cameraMoves > MAX_BEAT_CAMERA_MOVES) {
    issues.push({
      severity: "warning",
      stage: "duration",
      path: beatPath,
      message: `비트 하나에서 카메라가 ${cameraMoves}번 움직입니다. ${MAX_BEAT_CAMERA_MOVES}번 이하로 나누는 편이 좋습니다.`,
    });
  }

  return issues;
};
