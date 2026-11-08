import { compileLectureScenario } from "../compiler/compileLectureScenario";
import {
  type LectureCompileIssue,
  type LectureCompileIssueStage,
  type LectureCompileSourceMap,
  type LectureCompilerTree,
} from "../compiler/types";
import { lectureScenarioSchema } from "../scenario/schema";
import { type LectureScenario } from "../scenario/types";
import { type LectureScript } from "../types";
import { getLectureScenarioWithoutNulls } from "./strictJsonSchema";

/*
모델 응답은 다음 순서로 처리한다. 어느 단계에서 멈췄는지에 따라 원인과 대응이 달라, 결과와 로그에서 나눈다.

| 단계    | 하는 일                                   | 실패의 뜻                                       |
| ------- | ----------------------------------------- | ----------------------------------------------- |
| json    | 응답 문자열을 JSON으로 읽는다             | 응답이 잘렸거나 거절됐다. 다시 요청한다         |
| schema  | null을 뺀 뒤 lectureScenarioSchema로 검사 | strict 스키마가 못 막는 규칙을 어겼다           |
| compile | 트리에 맞춰 대본으로 컴파일한다           | 없는 노드, 트리와 맞지 않는 recipe, 조합 문제   |
*/
export type LectureGenerationStep = "json" | "schema" | "compile";

/*
json 단계 문제는 시나리오 위치가 없어 path가 빈 배열이다.
*/
export type LectureGenerationIssueStage = "json" | LectureCompileIssueStage;

export type LectureGenerationIssue = Omit<LectureCompileIssue, "stage"> & {
  stage: LectureGenerationIssueStage;
};

/*
모델 호출의 토큰 사용량. 백엔드가 모델 응답의 usage를 담아 준다. 받지 못하면 null로 둔다.
*/
export type LectureGenerationUsage = {
  inputTokens: number;
  outputTokens: number;
};

/*
생성 품질을 비교하기 위한 측정값. 평가 실행기와 로그가 같은 값을 쓴다.
*/
export type LectureGenerationMetrics = {
  issueCountByStage: Record<LectureGenerationIssueStage, number>; // error와 warning을 함께 센다
  sceneCount: number | null; // 스키마를 통과하지 못하면 셀 수 없어 null
  beatCount: number | null;
  cueCount: number | null;
  usage: LectureGenerationUsage | null;
};

export type LectureGenerationResult =
  | {
      success: true;
      scenario: LectureScenario; // repair나 평가에서 원래 시나리오를 다시 볼 수 있게 둔다
      script: LectureScript;
      sourceMap: LectureCompileSourceMap;
      warnings: LectureGenerationIssue[];
      metrics: LectureGenerationMetrics;
    }
  | {
      success: false;
      failedStep: LectureGenerationStep;
      issues: LectureGenerationIssue[]; // error가 하나 이상 있고, 함께 발견한 warning도 담는다
      metrics: LectureGenerationMetrics;
    };

type GetLectureGenerationResultOptions = {
  scriptId: string; // 만들 대본의 ID
  tree: LectureCompilerTree; // 모델에 outline으로 넘긴 트리
  usage: LectureGenerationUsage | null; // 백엔드가 담아 준 토큰 사용량
};

const ISSUE_STAGES: LectureGenerationIssueStage[] = [
  "json",
  "schema",
  "node",
  "recipe",
  "composition",
  "duration",
];

/*
함수 이름 : getIssueCountByStage
기능 : 문제를 단계별로 센다. 문제가 없는 단계도 0으로 넣어 로그의 모양을 고정한다.
인자 : LectureGenerationIssue[] issues -> 처리 중 발견한 문제
반환값 : 단계별 문제 수
*/
const getIssueCountByStage = (
  issues: LectureGenerationIssue[],
): Record<LectureGenerationIssueStage, number> => {
  const counts = Object.fromEntries(
    ISSUE_STAGES.map((stage) => [stage, 0]),
  ) as Record<LectureGenerationIssueStage, number>;

  for (const { stage } of issues) counts[stage] += 1;

  return counts;
};

/*
함수 이름 : getScenarioCounts
기능 : 시나리오의 장면, 비트, cue 수를 센다.
인자 : LectureScenario | null scenario -> 스키마를 통과한 시나리오. 통과하지 못했으면 null
반환값 : 장면, 비트, cue 수. 시나리오가 없으면 모두 null
*/
const getScenarioCounts = (scenario: LectureScenario | null) => {
  if (scenario === null) {
    return { sceneCount: null, beatCount: null, cueCount: null };
  }

  const beats = scenario.scenes.flatMap(({ beats }) => beats);

  return {
    sceneCount: scenario.scenes.length,
    beatCount: beats.length,
    cueCount: beats.reduce((count, { cues }) => count + cues.length, 0),
  };
};

/*
함수 이름 : getLectureGenerationResult
기능 : strict 모드 모델 응답 문자열을 JSON, 스키마, 컴파일 단계로 처리해 대본을 만든다.
실패하면 멈춘 단계와 시나리오 위치별 문제를, 성공하면 대본과 경고를 측정값과 함께 돌려준다.
인자 : string responseText -> 모델이 돌려준 응답 본문
GetLectureGenerationResultOptions options -> 대본 ID, 트리, 토큰 사용량
반환값 : 생성 결과와 측정값
*/
export const getLectureGenerationResult = (
  responseText: string,
  { scriptId, tree, usage }: GetLectureGenerationResultOptions,
): LectureGenerationResult => {
  let json: unknown;

  try {
    json = JSON.parse(responseText);
  } catch (error) {
    const issues: LectureGenerationIssue[] = [
      {
        severity: "error",
        stage: "json",
        path: [],
        message:
          `응답을 JSON으로 읽지 못했습니다. ${error instanceof Error ? error.message : ""}`.trim(),
      },
    ];

    return {
      success: false,
      failedStep: "json",
      issues,
      metrics: {
        issueCountByStage: getIssueCountByStage(issues),
        ...getScenarioCounts(null),
        usage,
      },
    };
  }

  const input = getLectureScenarioWithoutNulls(json);
  const parsed = lectureScenarioSchema.safeParse(input);
  const scenario = parsed.success ? parsed.data : null;
  const compiled = compileLectureScenario(input, { scriptId, tree });
  const issues = compiled.success ? compiled.warnings : compiled.issues;
  const metrics: LectureGenerationMetrics = {
    issueCountByStage: getIssueCountByStage(issues),
    ...getScenarioCounts(scenario),
    usage,
  };

  if (!compiled.success) {
    return {
      success: false,
      failedStep: scenario === null ? "schema" : "compile",
      issues,
      metrics,
    };
  }

  /*
  컴파일러가 같은 스키마로 검사해 성공했으므로 scenario가 null일 수 없다.
  */
  if (scenario === null) {
    throw new Error("컴파일에 성공한 시나리오가 스키마 검사에 실패했습니다.");
  }

  return {
    success: true,
    scenario,
    script: compiled.script,
    sourceMap: compiled.sourceMap,
    warnings: issues,
    metrics,
  };
};
