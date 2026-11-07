import {
  type LectureGenerationIssueStage,
  type LectureGenerationResult,
} from "./generationResult";

/*
repair는 모델이 만든 시나리오의 문제를 알려 주고 고친 시나리오를 다시 받는 요청이다.
요청마다 비용과 시간이 들어, 고칠 수 있는 문제에만 정해진 횟수까지 보낸다.

| 멈춘 단계 | repair | 이유                                                             |
| --------- | ------ | ---------------------------------------------------------------- |
| json      | 안 함  | 고칠 시나리오가 없다. 응답이 잘렸거나 거절된 것이라 다시 요청한다 |
| schema    | 함     | 빈 문자열, 중복 ID처럼 strict 스키마가 못 막은 규칙 위반이다      |
| compile   | 함     | 없는 노드, 트리와 맞지 않는 role처럼 위치를 짚어 고칠 수 있다    |

warning은 대본을 만들 수 있으므로 repair하지 않는다.
*/

export const MAX_LECTURE_REPAIR_ATTEMPTS = 1; // 첫 생성 뒤 repair를 보내는 최대 횟수
export const MAX_LECTURE_REPAIR_ISSUES = 20; // 한 요청에 담는 문제 수. 문제가 많으면 처음부터 다시 만드는 편이 낫다

export type LectureRepairIssue = {
  stage: LectureGenerationIssueStage;
  path: string; // 시나리오 안의 위치. 예: $.scenes[0].beats[1].cues[0].roles.subject
  message: string;
};

export type LectureRepairRequest = {
  attempt: number; // 이 요청이 몇 번째 repair인지. 1부터 센다
  previousResponseText: string; // 고칠 대상인 직전 모델 응답. 백엔드가 요청 사이에 상태를 갖지 않게 함께 보낸다
  issues: LectureRepairIssue[];
  omittedIssueCount: number; // 상한을 넘어 담지 못한 문제 수
};

type GetLectureRepairRequestParams = {
  result: LectureGenerationResult; // 직전 응답을 처리한 결과
  responseText: string; // 직전 모델 응답 본문
  repairCount: number; // 지금까지 보낸 repair 수
};

/*
함수 이름 : getLectureIssuePathText
기능 : 시나리오 위치를 모델이 읽기 쉬운 경로 문자열로 바꾼다.
인자 : PropertyKey[] path -> 시나리오 안의 위치
반환값 : $로 시작하는 경로. 예: $.scenes[0].title
*/
export const getLectureIssuePathText = (path: PropertyKey[]): string =>
  path.reduce<string>(
    (text, key) =>
      typeof key === "number" ? `${text}[${key}]` : `${text}.${String(key)}`,
    "$",
  );

/*
함수 이름 : getLectureRepairRequest
기능 : 직전 생성 결과로 repair 요청을 만든다. repair 정책에 맞지 않으면 만들지 않는다.
인자 : GetLectureRepairRequestParams
반환값 : repair 요청. 성공했거나, json 단계에서 멈췄거나, 횟수를 다 썼으면 null
*/
export const getLectureRepairRequest = ({
  result,
  responseText,
  repairCount,
}: GetLectureRepairRequestParams): LectureRepairRequest | null => {
  if (result.success) return null;
  if (result.failedStep === "json") return null;
  if (repairCount >= MAX_LECTURE_REPAIR_ATTEMPTS) return null;

  const errors = result.issues.filter(({ severity }) => severity === "error");

  return {
    attempt: repairCount + 1,
    previousResponseText: responseText,
    issues: errors
      .slice(0, MAX_LECTURE_REPAIR_ISSUES)
      .map(({ stage, path, message }) => ({
        stage,
        path: getLectureIssuePathText(path),
        message,
      })),
    omittedIssueCount: Math.max(errors.length - MAX_LECTURE_REPAIR_ISSUES, 0),
  };
};
