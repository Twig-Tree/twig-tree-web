import { createLectureCompilerTree } from "../../compiler/createLectureCompilerTree";
import { type LectureScenario } from "../../scenario/types";
import {
  getLectureGenerationResult,
  type LectureGenerationMetrics,
  type LectureGenerationStep,
} from "../generationResult";
import { type LectureOutlineNode } from "../treeOutline";
import {
  type LectureEvaluationCase,
  type LectureEvaluationExpectations,
  type LectureEvaluationResponse,
} from "./cases";

/*
기대 속성 검사 결과. 컴파일에 성공한 시나리오에서만 검사하고, 실패하면 null이다.
*/
export type LectureExpectationScore = {
  missingIntents: string[]; // 쓰지 않은 필수 intent
  missingNodeIds: string[]; // 가리키지 않은 필수 노드
  outOfScopeNodeIds: string[]; // 범위 밖에서 가리킨 노드
};

export type LectureEvaluationResponseScore = {
  caseId: string;
  model: string;
  failedStep: LectureGenerationStep | null; // 성공하면 null
  expectation: LectureExpectationScore | null;
  meetsExpectations: boolean; // 컴파일에 성공하고 기대 속성을 모두 갖췄다
  metrics: LectureGenerationMetrics;
};

export type LectureEvaluationSummary = {
  model: string;
  responseCount: number;
  schemaPassCount: number; // 스키마까지 통과한 응답 수
  compilePassCount: number; // 대본까지 만든 응답 수
  expectationPassCount: number;
  failedStepCounts: Record<LectureGenerationStep, number>;
  usageCount: number; // 토큰 사용량을 받은 응답 수. 평균은 이 수로 나눈다
  inputTokens: number;
  outputTokens: number;
};

/*
함수 이름 : getReferencedNodeIds
기능 : 시나리오가 장면과 role에서 가리킨 노드를 모은다.
인자 : LectureScenario scenario -> 스키마를 통과한 시나리오
반환값 : 가리킨 노드 ID 집합
*/
const getReferencedNodeIds = (scenario: LectureScenario): Set<string> =>
  new Set(
    scenario.scenes.flatMap((scene) => [
      scene.nodeId,
      ...scene.beats.flatMap(({ cues }) =>
        cues.flatMap(({ roles }) =>
          Object.values(roles as Record<string, string | string[] | undefined>)
            .flat()
            .filter((nodeId): nodeId is string => nodeId !== undefined),
        ),
      ),
    ]),
  );

/*
함수 이름 : getSubtreeNodeIds
기능 : 한 노드와 그 자손의 ID를 모은다.
인자 : LectureOutlineNode[] tree -> 평가 트리
string rootNodeId -> 하위 트리의 뿌리
반환값 : 하위 트리의 노드 ID 집합
*/
const getSubtreeNodeIds = (
  tree: LectureOutlineNode[],
  rootNodeId: string,
): Set<string> => {
  const nodeIds = new Set([rootNodeId]);
  let added = true;

  while (added) {
    added = false;

    for (const { id, parentId } of tree) {
      if (parentId !== null && nodeIds.has(parentId) && !nodeIds.has(id)) {
        nodeIds.add(id);
        added = true;
      }
    }
  }

  return nodeIds;
};

/*
함수 이름 : getExpectationScore
기능 : 시나리오가 case의 기대 속성을 갖췄는지 검사한다.
인자 : LectureScenario scenario -> 컴파일에 성공한 시나리오
LectureEvaluationExpectations expectations -> case의 기대 속성
LectureOutlineNode[] tree -> 평가 트리
반환값 : 빠진 intent와 노드, 범위 밖 노드
*/
const getExpectationScore = (
  scenario: LectureScenario,
  expectations: LectureEvaluationExpectations,
  tree: LectureOutlineNode[],
): LectureExpectationScore => {
  const intents = new Set<string>(
    scenario.scenes.flatMap(({ beats }) =>
      beats.flatMap(({ cues }) => cues.map(({ intent }) => intent)),
    ),
  );
  const referencedNodeIds = getReferencedNodeIds(scenario);
  const scopeNodeIds =
    expectations.scopeNodeId === null
      ? null
      : getSubtreeNodeIds(tree, expectations.scopeNodeId);

  return {
    missingIntents: expectations.requiredIntents.filter(
      (intent) => !intents.has(intent),
    ),
    missingNodeIds: expectations.requiredNodeIds.filter(
      (nodeId) => !referencedNodeIds.has(nodeId),
    ),
    outOfScopeNodeIds:
      scopeNodeIds === null
        ? []
        : [...referencedNodeIds].filter((nodeId) => !scopeNodeIds.has(nodeId)),
  };
};

/*
함수 이름 : getLectureEvaluationResponseScore
기능 : 저장한 모델 응답 하나를 실제 생성 경로(getLectureGenerationResult)로 처리하고 기대 속성을 채점한다.
인자 : LectureEvaluationCase evaluationCase -> 응답이 속한 case
LectureEvaluationResponse response -> 저장한 모델 응답
반환값 : 멈춘 단계, 기대 속성 결과, 측정값
*/
export const getLectureEvaluationResponseScore = (
  evaluationCase: LectureEvaluationCase,
  response: LectureEvaluationResponse,
): LectureEvaluationResponseScore => {
  const result = getLectureGenerationResult(response.responseText, {
    scriptId: `evaluation:${evaluationCase.id}`,
    tree: createLectureCompilerTree(evaluationCase.tree),
    usage: response.usage,
  });

  if (!result.success) {
    return {
      caseId: evaluationCase.id,
      model: response.model,
      failedStep: result.failedStep,
      expectation: null,
      meetsExpectations: false,
      metrics: result.metrics,
    };
  }

  const expectation = getExpectationScore(
    result.scenario,
    evaluationCase.expectations,
    evaluationCase.tree,
  );

  return {
    caseId: evaluationCase.id,
    model: response.model,
    failedStep: null,
    expectation,
    meetsExpectations: Object.values(expectation).every(
      (nodeIds) => nodeIds.length === 0,
    ),
    metrics: result.metrics,
  };
};

/*
함수 이름 : getLectureEvaluationSummaries
기능 : 응답 점수를 모델별로 모은다. 모델을 바꾸거나 프롬프트를 고쳤을 때 같은 case로 비교하기 위해서다.
인자 : LectureEvaluationResponseScore[] scores -> 응답별 점수
반환값 : 모델 이름 순으로 정렬한 모델별 요약
*/
export const getLectureEvaluationSummaries = (
  scores: LectureEvaluationResponseScore[],
): LectureEvaluationSummary[] => {
  const summaries = new Map<string, LectureEvaluationSummary>();

  for (const score of scores) {
    const summary = summaries.get(score.model) ?? {
      model: score.model,
      responseCount: 0,
      schemaPassCount: 0,
      compilePassCount: 0,
      expectationPassCount: 0,
      failedStepCounts: { json: 0, schema: 0, compile: 0 },
      usageCount: 0,
      inputTokens: 0,
      outputTokens: 0,
    };

    summary.responseCount += 1;
    if (score.failedStep === null || score.failedStep === "compile") {
      summary.schemaPassCount += 1;
    }
    if (score.failedStep === null) summary.compilePassCount += 1;
    else summary.failedStepCounts[score.failedStep] += 1;
    if (score.meetsExpectations) summary.expectationPassCount += 1;

    const { usage } = score.metrics;
    if (usage !== null) {
      summary.usageCount += 1;
      summary.inputTokens += usage.inputTokens;
      summary.outputTokens += usage.outputTokens;
    }

    summaries.set(score.model, summary);
  }

  return [...summaries.values()].sort((a, b) => a.model.localeCompare(b.model));
};
