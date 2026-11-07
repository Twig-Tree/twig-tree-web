import {
  compileLectureScenario,
  createLectureCompilerTree,
  LECTURE_SCENARIO_FIXTURES,
  type LectureAnimation,
  type LectureCompileIssue,
  type LectureCompileIssueSeverity,
  type LectureCompileIssueStage,
  type LectureCompilerTree,
  type LectureCompileSourceMap,
  type LectureScenarioFixture,
  type LectureScript,
} from "@/src/entities/lecture";
import { type TreeNode } from "@/src/entities/tree";

const LAB_SCENARIO_SCRIPT_ID = "animation-lab-scenario";

export type LabScenarioFixture = LectureScenarioFixture & {
  treeId: string; // 편집기 store를 채울 트리 ID. 같은 트리를 쓰는 fixture끼리는 같다
  treeNodes: TreeNode[]; // 캔버스에 그릴 트리
  compilerTree: LectureCompilerTree; // 컴파일러가 읽는 트리
};

/*
fixture 트리를 편집기 store가 읽는 모양으로 옮긴다. 형제 순서는 파일의 순서를 따른다.
트리 ID에 숫자가 아닌 접두사를 붙여, 제목 수정 같은 요청이 실수로 나가도 실제 트리를 가리키지 않게 한다.
*/
export const LAB_SCENARIO_FIXTURES: LabScenarioFixture[] =
  LECTURE_SCENARIO_FIXTURES.map((fixture) => ({
    ...fixture,
    treeId: `animation-lab:${fixture.treeName}`,
    treeNodes: fixture.tree.map(({ id, parentId, name }, orderIndex) => ({
      id,
      parentId,
      label: name,
      orderIndex,
      memo: null,
      tagIds: [],
    })),
    compilerTree: createLectureCompilerTree(fixture.tree),
  }));

export type LabScenarioIssue = {
  severity: LectureCompileIssueSeverity;
  stage: LectureCompileIssueStage | "json"; // json은 시나리오를 읽지도 못한 경우다
  path: string; // 묶음 안에서의 위치. 묶음 자체면 빈 문자열
  message: string;
};

/*
문제를 cue, 비트, 장면, 시나리오 전체 중 가장 가까운 단위로 묶는다. 모델 출력을 고칠 때 cue 단위로 보는 편이 빠르다.
*/
export type LabScenarioIssueGroup = {
  key: string; // 시나리오 안의 위치. 예: "scenes.0.beats.1.cues.0"
  label: string; // 화면에 보일 위치 이름
  issues: LabScenarioIssue[];
};

export type LabScenarioRun =
  | {
      success: true;
      script: LectureScript;
      sourceMap: LectureCompileSourceMap;
      animation: LectureAnimation; // 대본 전체를 한 번에 재생하는 애니메이션
      warningGroups: LabScenarioIssueGroup[];
    }
  | { success: false; issueGroups: LabScenarioIssueGroup[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getItem = (value: unknown, key: PropertyKey): unknown =>
  isRecord(value) || Array.isArray(value)
    ? (value as Record<PropertyKey, unknown>)[key]
    : undefined;

const getIdLabel = (value: unknown, fallback: number): string => {
  const id = getItem(value, "id");
  return typeof id === "string" ? id : `#${fallback + 1}`;
};

/*
함수 이름 : getIssueLocation
기능 : 문제 경로에서 묶을 단위(cue, 비트, 장면, 전체)와 그 안의 나머지 경로를 나눈다.
인자 : unknown scenario -> 이름을 읽을 시나리오. 검사 전 값이라 모양을 확인하며 읽는다
PropertyKey[] path -> 문제 경로
반환값 : 묶음 키, 위치 이름, 나머지 경로
*/
const getIssueLocation = (
  scenario: unknown,
  path: PropertyKey[],
): { key: string; label: string; rest: PropertyKey[] } => {
  const [scenesKey, sceneIndex, beatsKey, beatIndex, cuesKey, cueIndex] = path;

  if (scenesKey !== "scenes" || typeof sceneIndex !== "number") {
    return { key: "", label: "시나리오 전체", rest: path };
  }

  const scene = getItem(getItem(scenario, "scenes"), sceneIndex);
  const sceneLabel = `장면 ${getIdLabel(scene, sceneIndex)}`;

  if (beatsKey !== "beats" || typeof beatIndex !== "number") {
    return {
      key: `scenes.${sceneIndex}`,
      label: sceneLabel,
      rest: path.slice(2),
    };
  }

  const beat = getItem(getItem(scene, "beats"), beatIndex);
  const beatLabel = `${sceneLabel} › 비트 ${getIdLabel(beat, beatIndex)}`;

  if (cuesKey !== "cues" || typeof cueIndex !== "number") {
    return {
      key: `scenes.${sceneIndex}.beats.${beatIndex}`,
      label: beatLabel,
      rest: path.slice(4),
    };
  }

  const intent = getItem(getItem(getItem(beat, "cues"), cueIndex), "intent");

  return {
    key: `scenes.${sceneIndex}.beats.${beatIndex}.cues.${cueIndex}`,
    label: `${beatLabel} › cue ${cueIndex + 1}${typeof intent === "string" ? ` (${intent})` : ""}`,
    rest: path.slice(6),
  };
};

/*
함수 이름 : getLabScenarioIssueGroups
기능 : 컴파일 문제를 가장 가까운 cue, 비트, 장면 단위로 묶는다. 묶음 순서는 처음 나온 순서를 따른다.
인자 : unknown scenario -> 위치 이름을 읽을 시나리오
LectureCompileIssue[] issues -> 컴파일 문제
반환값 : 위치별 문제 묶음
*/
export const getLabScenarioIssueGroups = (
  scenario: unknown,
  issues: LectureCompileIssue[],
): LabScenarioIssueGroup[] => {
  const groups = new Map<string, LabScenarioIssueGroup>();

  for (const { severity, stage, path, message } of issues) {
    const { key, label, rest } = getIssueLocation(scenario, path);
    const group = groups.get(key) ?? { key, label, issues: [] };

    group.issues.push({
      severity,
      stage,
      path: rest.map(String).join("."),
      message,
    });
    groups.set(key, group);
  }

  return [...groups.values()];
};

/*
함수 이름 : getLabScenarioAnimation
기능 : 대본 전체를 애니메이션 하나로 잇는다. 비트는 내레이션 시간만큼은 머물고, 장면이 바뀌면 남은 효과를 지운다.
음성을 끈 강의 플레이어와 같은 흐름이다.
인자 : LectureScript script -> 컴파일한 대본
반환값 : 대본 전체를 차례로 재생하는 애니메이션
*/
export const getLabScenarioAnimation = (
  script: LectureScript,
): LectureAnimation => ({
  type: "group",
  mode: "sequence",
  children: script.scenes.flatMap((scene, sceneIndex) => [
    ...(sceneIndex > 0 ? [{ type: "reset", scope: "visual" } as const] : []),
    ...scene.beats.map(
      ({ animation, narration }): LectureAnimation => ({
        type: "group",
        mode: "parallel",
        children: [
          { type: "wait", durationMs: narration.fallbackDurationMs }, // 먼저 시작해야 재생 상태에 연출 이름이 남는다
          animation,
        ],
      }),
    ),
  ]),
});

/*
함수 이름 : getLabScenarioRun
기능 : 편집 중인 시나리오 JSON을 fixture 트리로 컴파일하고, 문제를 cue 단위로 묶는다.
인자 : string scenarioText -> 시나리오 JSON
LectureCompilerTree tree -> 시나리오가 가리키는 트리
반환값 : 대본과 재생할 애니메이션, 또는 위치별 문제 묶음
*/
export const getLabScenarioRun = (
  scenarioText: string,
  tree: LectureCompilerTree,
): LabScenarioRun => {
  let scenario: unknown;

  try {
    scenario = JSON.parse(scenarioText);
  } catch {
    return {
      success: false,
      issueGroups: [
        {
          key: "",
          label: "시나리오 전체",
          issues: [
            {
              severity: "error",
              stage: "json",
              path: "",
              message: "JSON 형식이 아닙니다.",
            },
          ],
        },
      ],
    };
  }

  const result = compileLectureScenario(scenario, {
    scriptId: LAB_SCENARIO_SCRIPT_ID,
    tree,
  });

  if (!result.success) {
    return {
      success: false,
      issueGroups: getLabScenarioIssueGroups(scenario, result.issues),
    };
  }

  return {
    success: true,
    script: result.script,
    sourceMap: result.sourceMap,
    animation: getLabScenarioAnimation(result.script),
    warningGroups: getLabScenarioIssueGroups(scenario, result.warnings),
  };
};
