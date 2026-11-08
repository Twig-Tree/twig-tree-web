import {
  type LectureCompileIssueSeverity,
  type LectureCompileIssueStage,
  type LectureCompileResult,
} from "../compiler/types";
import {
  type LectureGenerationIssueStage,
  type LectureGenerationMetrics,
  type LectureGenerationResult,
  type LectureGenerationStep,
} from "../generation/generationResult";
import { type LectureGenerationResponse } from "../generation/generationResponse";
import { getLectureScenarioWithoutNulls } from "../generation/strictJsonSchema";
import { lectureScenarioSchema } from "../scenario/schema";
import {
  getLectureCompileMetrics,
  type LectureCompileMetrics,
} from "./compileMetrics";
import {
  getLectureIssueLocation,
  type LectureIssueLocation,
} from "./issueLocation";

/*
강의 운영 로그. 보낼 곳은 logSink가 정하고, 이 파일은 이벤트 모양만 정한다.
어느 이벤트든 scriptId와 beat ID가 있으면 추적 기록(시나리오 원본과 source map)에서 원래 cue를 찾을 수 있다.
*/
export type LectureLogLevel = "info" | "warn" | "error";

export type LectureCompileLogIssue = LectureIssueLocation & {
  severity: LectureCompileIssueSeverity;
  stage: LectureCompileIssueStage;
  message: string;
};

export type LectureCompileLogEvent = {
  type: "lecture-compile";
  level: LectureLogLevel; // 실패면 error, warning이 있으면 warn
  scriptId: string;
  scenarioSchemaVersion: number | null; // 시나리오에서 읽지 못하면 null
  recipeRegistryVersion: number | null;
  success: boolean;
  metrics: LectureCompileMetrics;
  issues: LectureCompileLogIssue[];
};

export type LecturePlaybackFailureLogEvent = {
  type: "lecture-playback-failure";
  level: "error";
  scriptId: string;
  sceneIndex: number;
  beatIndex: number;
  sceneId: string;
  beatId: string; // 추적 기록의 source map에서 이 비트의 cue를 찾는다
  message: string; // 실패한 예외의 메시지
};

export type LectureGenerationLogIssue = Omit<
  LectureCompileLogIssue,
  "stage"
> & {
  stage: LectureGenerationIssueStage;
};

/*
모델 응답 하나를 처리한 결과. repair를 보내면 한 생성에서 이벤트가 두 번 나고, 둘은 같은 scriptId를 갖는다.
*/
export type LectureGenerationLogEvent = {
  type: "lecture-generation";
  level: LectureLogLevel; // 실패면 error, warning이 있으면 warn
  scriptId: string; // 한 생성의 첫 요청과 repair가 같은 값을 쓴다
  model: string;
  promptVersion: string;
  attemptCount: number; // 백엔드가 이 응답을 받으려고 모델을 부른 횟수(재시도 포함)
  repairAttempt: number; // 첫 요청이면 0, repair 응답이면 그 repair의 attempt
  scenarioSchemaVersion: number | null; // 응답에서 읽지 못하면 null
  recipeRegistryVersion: number | null;
  success: boolean;
  failedStep: LectureGenerationStep | null; // 성공했으면 null
  metrics: LectureGenerationMetrics;
  compileMetrics: LectureCompileMetrics | null; // JSON으로 읽지 못해 컴파일하지 않았으면 null
  issues: LectureGenerationLogIssue[];
};

export type LectureLogEvent =
  | LectureCompileLogEvent
  | LectureGenerationLogEvent
  | LecturePlaybackFailureLogEvent;

type CreateLectureCompileLogEventParams = {
  scenario: unknown; // 컴파일러에 넘긴 시나리오
  scriptId: string;
  result: LectureCompileResult;
  compileMs: number; // 컴파일에 걸린 시간
};

/*
함수 이름 : getScenarioVersion
기능 : 스키마를 통과하지 못한 시나리오에서도 버전 값을 읽는다. 어느 버전에서 실패가 잦은지 보려면 실패한 시나리오의 버전도 필요하다.
인자 : unknown scenario -> 시나리오
"scenarioSchemaVersion" | "recipeRegistryVersion" key -> 읽을 버전
반환값 : 버전. 숫자가 아니면 null
*/
const getScenarioVersion = (
  scenario: unknown,
  key: "scenarioSchemaVersion" | "recipeRegistryVersion",
): number | null => {
  if (typeof scenario !== "object" || scenario === null) return null;

  const value: unknown = (scenario as Record<string, unknown>)[key];

  return typeof value === "number" ? value : null;
};

/*
함수 이름 : createLectureCompileLogEvent
기능 : 컴파일 결과로 측정값과 위치를 풀어 쓴 문제를 담은 로그 이벤트를 만든다.
인자 : CreateLectureCompileLogEventParams
반환값 : 컴파일 로그 이벤트
*/
export const createLectureCompileLogEvent = ({
  scenario,
  scriptId,
  result,
  compileMs,
}: CreateLectureCompileLogEventParams): LectureCompileLogEvent => {
  /*
  컴파일러도 안에서 스키마를 검사하지만 결과에 시나리오를 담지 않는다. 시나리오가 작아 한 번 더 검사한다.
  */
  const parsed = lectureScenarioSchema.safeParse(scenario);
  const parsedScenario = parsed.success ? parsed.data : null;
  const issues = result.success ? result.warnings : result.issues;
  const sourceMap = result.success ? result.sourceMap : null;

  return {
    type: "lecture-compile",
    level: !result.success ? "error" : issues.length > 0 ? "warn" : "info",
    scriptId,
    scenarioSchemaVersion: getScenarioVersion(
      scenario,
      "scenarioSchemaVersion",
    ),
    recipeRegistryVersion: getScenarioVersion(
      scenario,
      "recipeRegistryVersion",
    ),
    success: result.success,
    metrics: getLectureCompileMetrics({
      scenario: parsedScenario,
      issues,
      compileMs,
    }),
    issues: issues.map(({ severity, stage, path, message }) => ({
      severity,
      stage,
      message,
      ...getLectureIssueLocation(path, parsedScenario, sourceMap),
    })),
  };
};

type CreateLectureGenerationLogEventParams = {
  response: LectureGenerationResponse; // 백엔드가 돌려준 모델 응답
  scriptId: string;
  repairAttempt: number; // 첫 요청이면 0
  result: LectureGenerationResult; // response.responseText를 처리한 결과
  processMs: number; // 응답 처리(JSON 읽기, 스키마 검사, 컴파일)에 걸린 시간
};

/*
함수 이름 : getResponseScenario
기능 : 모델 응답 본문을 컴파일러가 읽은 것과 같은 모양으로 다시 읽는다. 실패한 결과에는 시나리오가 없어 버전과 위치를 풀려면 필요하다.
인자 : string responseText -> 모델 응답 본문
반환값 : null을 뺀 시나리오 입력. JSON으로 읽지 못하면 undefined
*/
const getResponseScenario = (responseText: string): unknown => {
  try {
    return getLectureScenarioWithoutNulls(JSON.parse(responseText));
  } catch {
    return undefined;
  }
};

/*
함수 이름 : createLectureGenerationLogEvent
기능 : 모델 응답 하나를 처리한 결과로 모델, 프롬프트 버전, 생성·컴파일 측정값, 위치를 풀어 쓴 문제를 담은 로그 이벤트를 만든다.
인자 : CreateLectureGenerationLogEventParams
반환값 : 생성 로그 이벤트

생성 흐름은 컴파일을 getLectureGenerationResult 안에서 하므로 lecture-compile 이벤트를 따로 남기지 않는다.
컴파일 측정값과 문제 위치를 이 이벤트가 함께 담는다.
*/
export const createLectureGenerationLogEvent = ({
  response,
  scriptId,
  repairAttempt,
  result,
  processMs,
}: CreateLectureGenerationLogEventParams): LectureGenerationLogEvent => {
  const scenario = getResponseScenario(response.responseText);
  const parsedScenario = result.success
    ? result.scenario
    : (lectureScenarioSchema.safeParse(scenario).data ?? null);
  const issues = result.success ? result.warnings : result.issues;
  const sourceMap = result.success ? result.sourceMap : null;
  const failedStep = result.success ? null : result.failedStep;

  /*
  json 단계에서 멈춘 응답만 json 문제를 갖고, 그 밖의 문제는 모두 컴파일러가 낸 것이다.
  */
  const compileIssues = issues.flatMap(({ stage, ...issue }) =>
    stage === "json" ? [] : [{ ...issue, stage }],
  );

  return {
    type: "lecture-generation",
    level: !result.success ? "error" : issues.length > 0 ? "warn" : "info",
    scriptId,
    model: response.model,
    promptVersion: response.promptVersion,
    attemptCount: response.attemptCount,
    repairAttempt,
    scenarioSchemaVersion: getScenarioVersion(
      scenario,
      "scenarioSchemaVersion",
    ),
    recipeRegistryVersion: getScenarioVersion(
      scenario,
      "recipeRegistryVersion",
    ),
    success: result.success,
    failedStep,
    metrics: result.metrics,
    compileMetrics:
      failedStep === "json"
        ? null
        : getLectureCompileMetrics({
            scenario: parsedScenario,
            issues: compileIssues,
            compileMs: processMs,
          }),
    issues: issues.map(({ severity, stage, path, message }) => ({
      severity,
      stage,
      message,
      ...getLectureIssueLocation(path, parsedScenario, sourceMap),
    })),
  };
};

/*
함수 이름 : getErrorMessage
기능 : 던져진 값을 로그에 담을 문자열로 바꾼다. toString이 던지는 객체도 있어, 실패 처리 도중 다시 예외가 나면 비트가 끝나지 않으므로 막는다.
인자 : unknown error -> 던져진 값
반환값 : 예외 메시지. 문자열로 바꾸지 못하면 고정 문구
*/
const getErrorMessage = (error: unknown): string => {
  try {
    return error instanceof Error ? error.message : String(error);
  } catch {
    return "문자열로 바꿀 수 없는 예외";
  }
};

type CreateLecturePlaybackFailureLogEventParams = {
  script: {
    id: string;
    scenes: { id: string; beats: { id: string }[] }[];
  }; // 재생 중인 대본. 대본과 편집기 대본을 모두 받는다
  sceneIndex: number;
  beatIndex: number;
  error: unknown; // 비트 애니메이션이 던진 예외
};

/*
함수 이름 : createLecturePlaybackFailureLogEvent
기능 : 비트 애니메이션 실패를 대본 위치와 함께 로그 이벤트로 만든다.
인자 : CreateLecturePlaybackFailureLogEventParams
반환값 : 재생 실패 로그 이벤트
*/
export const createLecturePlaybackFailureLogEvent = ({
  script,
  sceneIndex,
  beatIndex,
  error,
}: CreateLecturePlaybackFailureLogEventParams): LecturePlaybackFailureLogEvent => {
  const scene = script.scenes[sceneIndex];

  return {
    type: "lecture-playback-failure",
    level: "error",
    scriptId: script.id,
    sceneIndex,
    beatIndex,
    sceneId: scene.id,
    beatId: scene.beats[beatIndex].id,
    message: getErrorMessage(error),
  };
};
