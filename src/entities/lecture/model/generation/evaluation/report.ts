import { type LectureEvaluationCase } from "./cases";
import {
  getLectureEvaluationResponseScore,
  getLectureEvaluationSummaries,
  type LectureEvaluationResponseScore,
} from "./score";

/*
함수 이름 : getTableCellText
기능 : 문자열을 마크다운 표 셀에 넣을 수 있게 바꾼다. |는 열을, 줄바꿈은 행을 나누므로 이스케이프하고 공백으로 합친다.
인자 : string text -> 셀에 넣을 문자열
반환값 : 표 셀용 문자열
*/
const getTableCellText = (text: string): string =>
  text.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");

/*
함수 이름 : getRateText
기능 : 통과 수를 "통과/전체 (비율)"로 쓴다.
인자 : number count -> 통과 수
number total -> 전체 수
반환값 : 예: 3/4 (75%)
*/
const getRateText = (count: number, total: number): string =>
  `${count}/${total} (${Math.round((count / total) * 100)}%)`;

/*
함수 이름 : getAverageText
기능 : 합계를 개수로 나눈 평균을 정수로 쓴다. 개수가 0이면 -를 쓴다.
인자 : number sum -> 합계
number count -> 개수
반환값 : 평균 문자열
*/
const getAverageText = (sum: number, count: number): string =>
  count === 0 ? "-" : String(Math.round(sum / count));

/*
함수 이름 : getFailureText
기능 : 기대에 못 미친 응답의 이유를 한 줄로 쓴다.
인자 : LectureEvaluationResponseScore score -> 응답 점수
반환값 : 멈춘 단계나 빠진 속성
*/
const getFailureText = ({
  failedStep,
  expectation,
  metrics,
}: LectureEvaluationResponseScore): string => {
  if (failedStep !== null) {
    const counts = Object.entries(metrics.issueCountByStage)
      .filter(([, count]) => count > 0)
      .map(([stage, count]) => `${stage} ${count}`)
      .join(", ");

    return `${failedStep} 단계에서 멈춤 (${counts})`;
  }

  return [
    expectation?.missingIntents.length
      ? `빠진 intent ${expectation.missingIntents.join(", ")}`
      : null,
    expectation?.missingNodeIds.length
      ? `빠진 노드 ${expectation.missingNodeIds.join(", ")}`
      : null,
    expectation?.outOfScopeNodeIds.length
      ? `범위 밖 노드 ${expectation.outOfScopeNodeIds.join(", ")}`
      : null,
  ]
    .filter((text) => text !== null)
    .join(" / ");
};

/*
함수 이름 : getLectureEvaluationReportText
기능 : 모든 case의 저장한 응답을 채점해 마크다운 보고서로 쓴다. 모델 호출 없이 저장한 응답만 읽는다.
인자 : LectureEvaluationCase[] cases -> 평가 case 목록
반환값 : 모델·프롬프트별 요약, case별 결과, 기대에 못 미친 응답을 담은 마크다운
*/
export const getLectureEvaluationReportText = (
  cases: LectureEvaluationCase[],
): string => {
  /*
  case 항목마다 점수를 따로 둔다. ID로 다시 찾으면 같은 ID의 항목이 둘일 때 두 항목의 점수가 각 행에 합쳐진다.
  */
  const caseScores = cases.map((evaluationCase) =>
    evaluationCase.responses.map((response) =>
      getLectureEvaluationResponseScore(evaluationCase, response),
    ),
  );
  const scores = caseScores.flat();
  const summaries = getLectureEvaluationSummaries(scores);
  const lines = [
    "# 강의 생성 평가 결과",
    "",
    "`evaluation.test.ts`가 `cases/*.json`의 저장한 응답으로 만든 파일이다. 직접 고치지 않는다.",
    "",
    "## 모델·프롬프트별",
    "",
  ];

  if (summaries.length === 0) {
    lines.push("저장한 응답이 없다.");
  } else {
    lines.push(
      "| 모델 | 프롬프트 | 응답 | 스키마 통과 | 컴파일 통과 | 기대 충족 | 평균 입력 토큰 | 평균 출력 토큰 |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...summaries.map(
        (summary) =>
          `| ${[
            getTableCellText(summary.model),
            getTableCellText(summary.promptVersion),
            summary.responseCount,
            getRateText(summary.schemaPassCount, summary.responseCount),
            getRateText(summary.compilePassCount, summary.responseCount),
            getRateText(summary.expectationPassCount, summary.responseCount),
            getAverageText(summary.inputTokens, summary.usageCount),
            getAverageText(summary.outputTokens, summary.usageCount),
          ].join(" | ")} |`,
      ),
    );
  }

  lines.push(
    "",
    "## Case별",
    "",
    "| case | 요청 | 응답 | 기대 충족 |",
    "| --- | --- | --- | --- |",
    ...cases.map((evaluationCase, caseIndex) => {
      const responseScores = caseScores[caseIndex];
      const passCount = responseScores.filter(
        ({ meetsExpectations }) => meetsExpectations,
      ).length;

      return `| ${[
        getTableCellText(evaluationCase.id),
        getTableCellText(evaluationCase.request),
        responseScores.length,
        responseScores.length === 0
          ? "-"
          : getRateText(passCount, responseScores.length),
      ].join(" | ")} |`;
    }),
  );

  const failures = scores.filter(({ meetsExpectations }) => !meetsExpectations);

  if (failures.length > 0) {
    lines.push(
      "",
      "## 기대에 못 미친 응답",
      "",
      ...failures.map(
        (score) =>
          `- ${score.caseId} / ${score.model} / ${score.promptVersion}: ${getFailureText(score)}`,
      ),
    );
  }

  return `${lines.join("\n")}\n`;
};
