import { readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { LECTURE_SCENARIO_FIXTURES } from "../../scenario/fixtures";
import { getLectureGenerationVocabulary } from "../vocabulary";
import {
  createLectureEvaluationCase,
  LECTURE_EVALUATION_CASES,
  type LectureEvaluationCase,
} from "./cases";
import { getLectureEvaluationReportText } from "./report";
import {
  getLectureEvaluationResponseScore,
  getLectureEvaluationSummaries,
} from "./score";

const INTENTS = new Set<string>(
  getLectureGenerationVocabulary().intents.map(({ intent }) => intent),
);

/*
case마다 같은 트리의 valid 시나리오 fixture를 응답으로 붙인다. 사람이 쓴 참고 답안이 기대 속성을 갖추는지 보아,
기대 속성이 도달할 수 있는 조건인지와 채점 경로를 확인한다. 실제 모델 응답이 아니므로 cases 파일에는 넣지 않는다.
*/
const REFERENCE_CASES: LectureEvaluationCase[] = LECTURE_EVALUATION_CASES.map(
  (evaluationCase) => {
    const fixture = LECTURE_SCENARIO_FIXTURES.find(
      ({ kind, treeName }) =>
        kind === "valid" && treeName === evaluationCase.treeName,
    );

    return {
      ...evaluationCase,
      responses: [
        {
          model: "reference",
          promptVersion: "fixture",
          recordedAt: "2026-11-08T00:00:00.000Z",
          responseText: JSON.stringify(fixture?.scenario),
          usage: null,
        },
      ],
    };
  },
);

const [GOGURYEO_CASE] = REFERENCE_CASES.filter(
  ({ id }) => id === "goguryeo-capital-misconception",
);

describe("LECTURE_EVALUATION_CASES", () => {
  it("cases 디렉터리의 파일을 모두 담는다", () => {
    const fileNames = readdirSync(join(import.meta.dirname, "cases"))
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""));

    expect(LECTURE_EVALUATION_CASES.map(({ id }) => id).sort()).toEqual(
      fileNames.sort(),
    );
  });

  it("기대 속성은 어휘의 intent와 트리의 노드만 쓴다", () => {
    for (const { id, expectations, tree } of LECTURE_EVALUATION_CASES) {
      const nodeIds = new Set(tree.map((node) => node.id));

      expect(
        expectations.requiredIntents.filter((intent) => !INTENTS.has(intent)),
        id,
      ).toEqual([]);
      expect(
        expectations.requiredNodeIds.filter((nodeId) => !nodeIds.has(nodeId)),
        id,
      ).toEqual([]);
      if (expectations.scopeNodeId !== null) {
        expect(nodeIds.has(expectations.scopeNodeId), id).toBe(true);
      }
    }
  });

  it("형식이 틀린 case 파일은 바로 실패한다", () => {
    expect(() =>
      createLectureEvaluationCase("broken", { request: "요청" }),
    ).toThrow("평가 case broken의 형식이 틀렸습니다");
    expect(() =>
      createLectureEvaluationCase("unknown-tree", {
        request: "요청",
        treeName: "없는 트리",
        expectations: {
          requiredIntents: [],
          requiredNodeIds: [],
          scopeNodeId: null,
        },
        responses: [],
      }),
    ).toThrow("시나리오 fixture에 없습니다");
  });
});

describe("getLectureEvaluationResponseScore", () => {
  it("참고 답안은 모든 case의 기대 속성을 갖춘다", () => {
    for (const evaluationCase of REFERENCE_CASES) {
      const score = getLectureEvaluationResponseScore(
        evaluationCase,
        evaluationCase.responses[0],
      );

      expect(score, evaluationCase.id).toMatchObject({
        failedStep: null,
        meetsExpectations: true,
      });
    }
  });

  it("빠진 intent와 노드, 범위 밖 노드를 찾는다", () => {
    const score = getLectureEvaluationResponseScore(GOGURYEO_CASE, {
      model: "test",
      promptVersion: "test",
      recordedAt: "2026-11-08T00:00:00.000Z",
      responseText: JSON.stringify({
        scenarioSchemaVersion: 1,
        recipeRegistryVersion: 1,
        title: "고구려",
        scenes: [
          {
            id: "scene-1",
            nodeId: "1",
            beats: [
              {
                id: "beat-1",
                narration: { text: "수도를 봅니다." },
                cues: [{ intent: "introduce", roles: { subject: "3" } }],
              },
            ],
          },
        ],
      }),
      usage: null,
    });

    expect(score).toMatchObject({
      failedStep: null,
      meetsExpectations: false,
      expectation: {
        missingIntents: ["incorrect", "correct"],
        missingNodeIds: ["5"],
        outOfScopeNodeIds: ["1"],
      },
    });
  });

  it("처리에 실패하면 멈춘 단계를 남기고 기대 속성은 검사하지 않는다", () => {
    expect(
      getLectureEvaluationResponseScore(GOGURYEO_CASE, {
        model: "test",
        promptVersion: "test",
        recordedAt: "2026-11-08T00:00:00.000Z",
        responseText: "{",
        usage: { inputTokens: 100, outputTokens: 0 },
      }),
    ).toMatchObject({
      failedStep: "json",
      expectation: null,
      meetsExpectations: false,
    });
  });
});

describe("getLectureEvaluationSummaries", () => {
  it("모델과 프롬프트 버전의 조합별로 단계 통과 수와 토큰을 모은다", () => {
    const response = GOGURYEO_CASE.responses[0];
    const scores = [
      {
        ...response,
        model: "b",
        promptVersion: "v1",
        usage: { inputTokens: 100, outputTokens: 40 },
      },
      {
        ...response,
        model: "b",
        promptVersion: "v1",
        responseText: "{",
        usage: null,
      },
      {
        ...response,
        model: "b",
        promptVersion: "v2",
        usage: { inputTokens: 120, outputTokens: 50 },
      },
      {
        ...response,
        model: "b",
        promptVersion: "v2",
        responseText: JSON.stringify({
          ...JSON.parse(response.responseText),
          title: "",
        }),
        usage: null,
      },
      {
        ...response,
        model: "a",
        promptVersion: "v1",
        responseText: response.responseText.replace(
          '"nodeId":"2"',
          '"nodeId":"99"',
        ),
        usage: { inputTokens: 300, outputTokens: 60 },
      },
    ].map((saved) => getLectureEvaluationResponseScore(GOGURYEO_CASE, saved));

    expect(getLectureEvaluationSummaries(scores)).toEqual([
      {
        model: "a",
        promptVersion: "v1",
        responseCount: 1,
        schemaPassCount: 1,
        compilePassCount: 0,
        expectationPassCount: 0,
        failedStepCounts: { json: 0, schema: 0, compile: 1 },
        usageCount: 1,
        inputTokens: 300,
        outputTokens: 60,
      },
      {
        model: "b",
        promptVersion: "v1",
        responseCount: 2,
        schemaPassCount: 1,
        compilePassCount: 1,
        expectationPassCount: 1,
        failedStepCounts: { json: 1, schema: 0, compile: 0 },
        usageCount: 1,
        inputTokens: 100,
        outputTokens: 40,
      },
      {
        model: "b",
        promptVersion: "v2",
        responseCount: 2,
        schemaPassCount: 1,
        compilePassCount: 1,
        expectationPassCount: 1,
        failedStepCounts: { json: 0, schema: 1, compile: 0 },
        usageCount: 1,
        inputTokens: 120,
        outputTokens: 50,
      },
    ]);
  });
});

describe("getLectureEvaluationReportText", () => {
  /*
  저장한 응답으로 만든 평가 결과. cases 파일에 응답을 더한 뒤 다시 만든다.
  갱신: pnpm exec vitest run src/entities/lecture/model/generation/evaluation/evaluation.test.ts -u
  */
  it("저장소의 평가 결과 파일과 같다", async () => {
    await expect(
      getLectureEvaluationReportText(LECTURE_EVALUATION_CASES),
    ).toMatchFileSnapshot("./report.md");
  });

  it("참고 답안으로 모델·프롬프트별 요약과 실패 목록을 쓴다", () => {
    const report = getLectureEvaluationReportText([
      ...REFERENCE_CASES,
      {
        ...GOGURYEO_CASE,
        responses: [{ ...GOGURYEO_CASE.responses[0], responseText: "{" }],
      },
    ]);

    expect(report).toContain(
      "| reference | fixture | 6 | 5/6 (83%) | 5/6 (83%) | 5/6 (83%) | - | - |",
    );
    expect(report).toContain(
      "- goguryeo-capital-misconception / reference / fixture: json 단계에서 멈춤 (json 1)",
    );

    /*
    같은 ID의 case를 두 번 넣어도 각 행은 자기 응답만 센다.
    */
    expect(report).toContain(
      `| goguryeo-capital-misconception | ${GOGURYEO_CASE.request} | 1 | 1/1 (100%) |`,
    );
    expect(report).toContain(
      `| goguryeo-capital-misconception | ${GOGURYEO_CASE.request} | 1 | 0/1 (0%) |`,
    );
  });

  it("표 셀의 |와 줄바꿈이 표를 깨지 않는다", () => {
    const report = getLectureEvaluationReportText([
      {
        ...GOGURYEO_CASE,
        request: "수도 | 오해를\n바로잡아 줘",
        responses: [{ ...GOGURYEO_CASE.responses[0], model: "a|b" }],
      },
    ]);

    expect(report).toContain("| a\\|b | fixture | 1 |");
    expect(report).toContain(
      "| goguryeo-capital-misconception | 수도 \\| 오해를 바로잡아 줘 | 1 | 1/1 (100%) |",
    );
  });
});
