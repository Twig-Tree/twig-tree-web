import { describe, expect, it } from "vitest";
import { TEST_COMPILER_TREE } from "../compiler/testTree";
import {
  getLectureGenerationResult,
  type LectureGenerationIssue,
} from "./generationResult";
import {
  MAX_LECTURE_REPAIR_ATTEMPTS,
  MAX_LECTURE_REPAIR_ISSUES,
  getLectureIssuePathText,
  getLectureRepairRequest,
} from "./repairRequest";

const OPTIONS = { scriptId: "script-1", tree: TEST_COMPILER_TREE, usage: null };

/*
함수 이름 : getResponseText
기능 : 장면 하나에 주어진 cue를 비트마다 하나씩 담은 응답 문자열을 만든다.
인자 : unknown[] cues -> 비트마다 넣을 cue
반환값 : 모델 응답 본문
*/
const getResponseText = (cues: unknown[]) =>
  JSON.stringify({
    scenarioSchemaVersion: 1,
    recipeRegistryVersion: 1,
    title: "정렬",
    scenes: [
      {
        id: "scene-1",
        nodeId: "1",
        beats: cues.map((cue, index) => ({
          id: `beat-${index + 1}`,
          narration: { text: "설명합니다." },
          cues: [cue],
        })),
      },
    ],
  });

const MISSING_NODE_CUE = { intent: "introduce", roles: { subject: "999" } };

describe("getLectureIssuePathText", () => {
  it("배열 순번은 대괄호로, 필드는 점으로 잇는다", () => {
    expect(
      getLectureIssuePathText(["scenes", 0, "beats", 1, "roles", "subject"]),
    ).toBe("$.scenes[0].beats[1].roles.subject");
    expect(getLectureIssuePathText([])).toBe("$");
  });
});

describe("getLectureRepairRequest", () => {
  it("compile 단계 오류를 경로 문자열과 함께 담는다", () => {
    const responseText = getResponseText([MISSING_NODE_CUE]);
    const result = getLectureGenerationResult(responseText, OPTIONS);

    expect(
      getLectureRepairRequest({ result, responseText, repairCount: 0 }),
    ).toEqual({
      attempt: 1,
      previousResponseText: responseText,
      issues: [
        {
          stage: "node",
          path: "$.scenes[0].beats[0].cues[0].roles.subject",
          message: expect.any(String),
        },
      ],
      omittedIssueCount: 0,
    });
  });

  it("schema 단계 오류도 repair한다", () => {
    const responseText = getResponseText([
      { intent: "introduce", roles: { subject: "" } },
    ]);
    const result = getLectureGenerationResult(responseText, OPTIONS);

    expect(
      getLectureRepairRequest({ result, responseText, repairCount: 0 })
        ?.issues[0].stage,
    ).toBe("schema");
  });

  it("성공, json 단계 실패, 횟수 초과에는 만들지 않는다", () => {
    const validText = getResponseText([
      { intent: "introduce", roles: { subject: "1" } },
    ]);
    const invalidText = getResponseText([MISSING_NODE_CUE]);

    expect(
      getLectureRepairRequest({
        result: getLectureGenerationResult(validText, OPTIONS),
        responseText: validText,
        repairCount: 0,
      }),
    ).toBeNull();
    expect(
      getLectureRepairRequest({
        result: getLectureGenerationResult("{", OPTIONS),
        responseText: "{",
        repairCount: 0,
      }),
    ).toBeNull();
    expect(
      getLectureRepairRequest({
        result: getLectureGenerationResult(invalidText, OPTIONS),
        responseText: invalidText,
        repairCount: MAX_LECTURE_REPAIR_ATTEMPTS,
      }),
    ).toBeNull();
  });

  it("상한을 넘는 문제는 개수만 알린다", () => {
    const responseText = getResponseText(
      Array.from(
        { length: MAX_LECTURE_REPAIR_ISSUES + 3 },
        () => MISSING_NODE_CUE,
      ),
    );
    const request = getLectureRepairRequest({
      result: getLectureGenerationResult(responseText, OPTIONS),
      responseText,
      repairCount: 0,
    });

    expect(request?.issues).toHaveLength(MAX_LECTURE_REPAIR_ISSUES);
    expect(request?.omittedIssueCount).toBe(3);
  });

  /*
  warning을 거르기 전에 상한을 적용하면 warning이 자리를 차지해 error가 빠진다.
  */
  it("warning은 담지도 세지도 않고 error에만 상한을 적용한다", () => {
    const warning: LectureGenerationIssue = {
      severity: "warning",
      stage: "duration",
      path: ["scenes", 0, "beats", 0],
      message: "비트가 깁니다.",
    };
    const errors: LectureGenerationIssue[] = Array.from(
      { length: MAX_LECTURE_REPAIR_ISSUES + 3 },
      (_, index) => ({
        severity: "error",
        stage: "node",
        path: ["scenes", 1, "beats", index, "cues", 0, "roles", "subject"],
        message: "트리에 없는 노드(999)입니다.",
      }),
    );
    const issues = [warning, warning, ...errors];

    const request = getLectureRepairRequest({
      result: {
        success: false,
        failedStep: "compile",
        issues,
        metrics: {
          issueCountByStage: {
            json: 0,
            schema: 0,
            node: errors.length,
            recipe: 0,
            composition: 0,
            duration: 2,
          },
          sceneCount: 2,
          beatCount: errors.length + 1,
          cueCount: errors.length + 1,
          usage: null,
        },
      },
      responseText: "{}",
      repairCount: 0,
    });

    expect(request?.issues).toHaveLength(MAX_LECTURE_REPAIR_ISSUES);
    expect(request?.issues.every(({ stage }) => stage === "node")).toBe(true);
    expect(request?.issues[0].path).toBe(
      "$.scenes[1].beats[0].cues[0].roles.subject",
    );
    expect(request?.omittedIssueCount).toBe(3);
  });
});
