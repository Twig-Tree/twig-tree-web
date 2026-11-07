import * as z from "zod/mini";
import { LECTURE_SCENARIO_FIXTURES } from "../../scenario/fixtures";
import { type LectureOutlineNode } from "../treeOutline";
import asiaRegionsTour from "./cases/asia-regions-tour.json";
import goguryeoCapitalMisconception from "./cases/goguryeo-capital-misconception.json";
import httpRequestTrace from "./cases/http-request-trace.json";
import mammalReptileCompare from "./cases/mammal-reptile-compare.json";
import photosynthesisSummary from "./cases/photosynthesis-summary.json";

/*
강의 생성 평가 case. 대표 요청 하나와 좋은 시나리오가 갖춰야 할 속성, 그 요청에 대해 저장한 모델 응답을 담는다.
트리는 시나리오 fixture의 trees/<이름>.json을 함께 쓴다.
기대 속성은 정답 시나리오가 아니라 "적어도 이것은 있어야 한다"는 최소 조건이다. 같은 요청에도 좋은 시나리오가 여럿이기 때문이다.
*/
const evaluationCaseFileSchema = z.strictObject({
  request: z.string(), // 사용자가 입력한 요청 문장
  treeName: z.string(), // 시나리오 fixture의 트리 이름
  expectations: z.strictObject({
    requiredIntents: z.array(z.string()), // 적어도 한 번 써야 할 intent
    requiredNodeIds: z.array(z.string()), // 장면이나 role에서 적어도 한 번 가리켜야 할 노드
    scopeNodeId: z.nullable(z.string()), // 이 노드의 하위 트리 밖은 가리키지 않는다. null이면 트리 전체
  }),
  /*
  저장한 모델 응답. 백엔드 엔드포인트로 실제 호출한 결과를 쌓는다.
  */
  responses: z.array(
    z.strictObject({
      model: z.string(), // 예: gpt-4o-mini-2024-07-18
      promptVersion: z.string(), // 백엔드가 응답에 담아 준 프롬프트 버전. 같은 모델의 프롬프트 변경 전후를 나눈다
      recordedAt: z.string(), // 호출한 시각(ISO 8601)
      responseText: z.string(), // 모델 응답 본문 그대로
      usage: z.nullable(
        z.strictObject({ inputTokens: z.number(), outputTokens: z.number() }),
      ),
    }),
  ),
});

type LectureEvaluationCaseFile = z.infer<typeof evaluationCaseFileSchema>;

export type LectureEvaluationExpectations =
  LectureEvaluationCaseFile["expectations"];
export type LectureEvaluationResponse =
  LectureEvaluationCaseFile["responses"][number];

export type LectureEvaluationCase = LectureEvaluationCaseFile & {
  id: string; // cases 디렉터리의 파일 이름
  tree: LectureOutlineNode[];
};

const CASE_FILES: [string, unknown][] = [
  ["asia-regions-tour", asiaRegionsTour],
  ["goguryeo-capital-misconception", goguryeoCapitalMisconception],
  ["http-request-trace", httpRequestTrace],
  ["mammal-reptile-compare", mammalReptileCompare],
  ["photosynthesis-summary", photosynthesisSummary],
];

/*
함수 이름 : createLectureEvaluationCase
기능 : case 파일을 검사하고 이름이 가리키는 fixture 트리를 붙인다. 응답을 손으로 붙여 넣는 파일이라 형식이 틀리면 바로 실패시킨다.
인자 : string id -> case 파일 이름
unknown file -> case 파일 내용
반환값 : 트리를 붙인 평가 case
*/
export const createLectureEvaluationCase = (
  id: string,
  file: unknown,
): LectureEvaluationCase => {
  const parsed = evaluationCaseFileSchema.safeParse(file);

  if (!parsed.success) {
    throw new Error(
      `평가 case ${id}의 형식이 틀렸습니다: ${parsed.error.message}`,
    );
  }

  const treeFixture = LECTURE_SCENARIO_FIXTURES.find(
    ({ kind, treeName }) =>
      kind === "valid" && treeName === parsed.data.treeName,
  );

  if (!treeFixture) {
    throw new Error(
      `평가 case ${id}의 트리(${parsed.data.treeName})가 시나리오 fixture에 없습니다.`,
    );
  }

  return { ...parsed.data, id, tree: treeFixture.tree };
};

/*
평가 실행기가 읽는 case 목록. 디렉터리의 파일과 같은지는 evaluation.test.ts가 확인한다.
*/
export const LECTURE_EVALUATION_CASES: LectureEvaluationCase[] = CASE_FILES.map(
  ([id, file]) => createLectureEvaluationCase(id, file),
);
