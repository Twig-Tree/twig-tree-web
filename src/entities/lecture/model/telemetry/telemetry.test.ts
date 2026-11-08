import { afterEach, describe, expect, it, vi } from "vitest";
import { compileLectureScenario } from "../compiler/compileLectureScenario";
import { getLectureGenerationResult } from "../generation/generationResult";
import { TEST_COMPILER_TREE } from "../compiler/testTree";
import { type LectureScenario, type ScenarioCue } from "../scenario/types";
import { getLectureCompileMetrics } from "./compileMetrics";
import { getLectureIssueLocation } from "./issueLocation";
import {
  createLectureCompileLogEvent,
  createLectureGenerationLogEvent,
  createLecturePlaybackFailureLogEvent,
  type LectureLogEvent,
} from "./logEvents";
import { logLectureEvent, setLectureLogSink } from "./logSink";

const createScenario = (beatCues: ScenarioCue[][]): LectureScenario => ({
  scenarioSchemaVersion: 1,
  recipeRegistryVersion: 1,
  title: "정렬 알고리즘",
  scenes: [
    {
      id: "scene-1",
      nodeId: "1",
      beats: beatCues.map((cues, index) => ({
        id: `beat-${index + 1}`,
        narration: { text: `${index + 1}번째 비트의 설명입니다.` },
        cues,
      })),
    },
  ],
});

const compile = (scenario: unknown) => {
  const result = compileLectureScenario(scenario, {
    scriptId: "script-1",
    tree: TEST_COMPILER_TREE,
  });

  return createLectureCompileLogEvent({
    scenario,
    scriptId: "script-1",
    result,
    compileMs: 12,
  });
};

const FULL_DELIVERY = {
  pace: "normal",
  intensity: "medium",
  tone: "accent",
  continuity: "transient",
} as const;

afterEach(() => {
  setLectureLogSink(null);
  vi.restoreAllMocks();
});

describe("getLectureCompileMetrics", () => {
  it("delivery를 하나라도 비운 cue를 fallback으로 세고 필드별 수를 남긴다", () => {
    const scenario = createScenario([
      [
        {
          intent: "introduce",
          roles: { subject: "1" },
          delivery: FULL_DELIVERY,
        },
      ],
      [
        {
          intent: "introduce",
          roles: { subject: "2" },
          delivery: { pace: "quick" },
        },
      ],
      [{ intent: "introduce", roles: { subject: "3" } }],
    ]);

    expect(
      getLectureCompileMetrics({ scenario, issues: [], compileMs: 5 }),
    ).toEqual({
      compileMs: 5,
      cueCount: 3,
      defaultDeliveryCueCount: 2,
      defaultDeliveryFieldCounts: {
        pace: 1,
        intensity: 2,
        tone: 2,
        continuity: 2,
      },
      invalidRoleCueCount: 0,
      fallbackRate: 2 / 3,
      invalidRoleRate: 0,
    });
  });

  it("roles 아래에 node·recipe 문제가 있는 cue를 한 번씩 센다", () => {
    const { metrics, issues } = compile(
      createScenario([
        [{ intent: "introduce", roles: { subject: "1" } }],
        [{ intent: "compare", roles: { left: ["998"], right: ["999"] } }],
        [{ intent: "decompose", roles: { parent: "1", children: ["5"] } }],
      ]),
    );

    expect(issues.filter(({ stage }) => stage === "node")).toHaveLength(2);
    expect(issues.some(({ stage }) => stage === "recipe")).toBe(true);
    expect(metrics).toMatchObject({
      cueCount: 3,
      invalidRoleCueCount: 2,
      invalidRoleRate: 2 / 3,
    });
  });

  it("cue가 없으면 비율을 null로 둔다", () => {
    expect(
      getLectureCompileMetrics({
        scenario: createScenario([[]]),
        issues: [],
        compileMs: 1,
      }),
    ).toMatchObject({ cueCount: 0, fallbackRate: null, invalidRoleRate: null });
  });
});

describe("createLectureCompileLogEvent", () => {
  it("성공하면 info로, 측정값과 버전을 담는다", () => {
    expect(
      compile(
        createScenario([[{ intent: "introduce", roles: { subject: "1" } }]]),
      ),
    ).toMatchObject({
      type: "lecture-compile",
      level: "info",
      scriptId: "script-1",
      scenarioSchemaVersion: 1,
      recipeRegistryVersion: 1,
      success: true,
      metrics: { compileMs: 12, cueCount: 1 },
      issues: [],
    });
  });

  it("실패한 문제를 장면·비트·cue·intent·recipe로 풀어 쓴다", () => {
    const event = compile(
      createScenario([
        [{ intent: "compare", roles: { left: ["2"], right: ["999"] } }],
      ]),
    );

    expect(event.level).toBe("error");
    expect(event.issues).toEqual([
      {
        severity: "error",
        stage: "node",
        message: "트리에 없는 노드(999)입니다.",
        path: "$.scenes[0].beats[0].cues[0].roles.right[0]",
        sceneId: "scene-1",
        beatId: "beat-1",
        cueIndex: 0,
        intent: "compare",
        recipeId: "compare",
        animationPaths: [],
      },
    ]);
  });

  it("스키마를 통과하지 못해도 버전은 남기고 cue 단위 값은 비운다", () => {
    const event = compile({
      scenarioSchemaVersion: 1,
      recipeRegistryVersion: 7,
    });

    expect(event).toMatchObject({
      level: "error",
      scenarioSchemaVersion: 1,
      recipeRegistryVersion: 7,
      success: false,
      metrics: { cueCount: null, fallbackRate: null, invalidRoleRate: null },
    });
    expect(event.issues.every(({ stage }) => stage === "schema")).toBe(true);
  });
});

describe("createLectureGenerationLogEvent", () => {
  const generate = (responseText: string, repairAttempt = 0) => {
    const response = {
      responseText,
      model: "gpt-4o-mini-2024-07-18",
      promptVersion: "lecture-v1",
      usage: { inputTokens: 1200, outputTokens: 340 },
      attemptCount: 1,
    };

    return createLectureGenerationLogEvent({
      response,
      scriptId: "script-1",
      repairAttempt,
      result: getLectureGenerationResult(responseText, {
        scriptId: "script-1",
        tree: TEST_COMPILER_TREE,
        usage: response.usage,
      }),
      processMs: 12,
    });
  };

  it("성공하면 모델, 프롬프트 버전, 생성·컴파일 측정값을 담는다", () => {
    const event = generate(
      JSON.stringify(
        createScenario([[{ intent: "introduce", roles: { subject: "1" } }]]),
      ),
    );

    expect(event).toMatchObject({
      type: "lecture-generation",
      level: "info",
      scriptId: "script-1",
      model: "gpt-4o-mini-2024-07-18",
      promptVersion: "lecture-v1",
      attemptCount: 1,
      repairAttempt: 0,
      scenarioSchemaVersion: 1,
      recipeRegistryVersion: 1,
      success: true,
      failedStep: null,
      metrics: {
        cueCount: 1,
        usage: { inputTokens: 1200, outputTokens: 340 },
      },
      compileMetrics: { compileMs: 12, cueCount: 1 },
      issues: [],
    });
  });

  /*
  실패한 결과에는 시나리오가 없으므로, 응답을 다시 읽어 위치를 풀었는지 본다.
  */
  it("컴파일에 실패하면 응답의 시나리오로 문제 위치를 풀어 쓴다", () => {
    const event = generate(
      JSON.stringify(
        createScenario([
          [{ intent: "compare", roles: { left: ["2"], right: ["999"] } }],
        ]),
      ),
      1,
    );

    expect(event).toMatchObject({
      level: "error",
      repairAttempt: 1,
      success: false,
      failedStep: "compile",
      compileMetrics: { cueCount: 1, invalidRoleCueCount: 1 },
    });
    expect(event.issues).toEqual([
      expect.objectContaining({
        stage: "node",
        sceneId: "scene-1",
        beatId: "beat-1",
        cueIndex: 0,
        intent: "compare",
        recipeId: "compare",
      }),
    ]);
  });

  it("JSON으로 읽지 못하면 버전과 컴파일 측정값을 비운다", () => {
    const event = generate('{"scenarioSchemaVersion":1,');

    expect(event).toMatchObject({
      level: "error",
      scenarioSchemaVersion: null,
      recipeRegistryVersion: null,
      success: false,
      failedStep: "json",
      compileMetrics: null,
    });
    expect(event.issues).toEqual([
      expect.objectContaining({ stage: "json", path: "$" }),
    ]);
  });
});

describe("getLectureIssueLocation", () => {
  it("성공한 컴파일의 source map으로 cue가 만든 animation 위치를 찾는다", () => {
    const scenario = createScenario([
      [
        { intent: "introduce", roles: { subject: "1" } },
        { intent: "emphasize", roles: { subject: ["2"] } },
      ],
    ]);
    const result = compileLectureScenario(scenario, {
      scriptId: "script-1",
      tree: TEST_COMPILER_TREE,
    });

    if (!result.success) throw new Error("컴파일 실패");

    expect(
      getLectureIssueLocation(
        ["scenes", 0, "beats", 0, "cues", 1],
        scenario,
        result.sourceMap,
      ),
    ).toEqual({
      path: "$.scenes[0].beats[0].cues[1]",
      sceneId: "scene-1",
      beatId: "beat-1",
      cueIndex: 1,
      intent: "emphasize",
      recipeId: "spotlight",
      animationPaths: ["$.animation.children[1]"],
    });
  });

  it("비트 위치까지만 가리키면 cue 값은 null이다", () => {
    expect(
      getLectureIssueLocation(
        ["scenes", 0, "beats", 0, "narration"],
        createScenario([[]]),
        null,
      ),
    ).toMatchObject({ beatId: "beat-1", cueIndex: null, intent: null });
  });
});

describe("createLecturePlaybackFailureLogEvent", () => {
  it("문자열로 바꿀 수 없는 예외도 고정 문구로 담는다", () => {
    const unprintable = {
      toString: () => {
        throw new Error("변환 실패");
      },
    };

    expect(
      createLecturePlaybackFailureLogEvent({
        script: { id: "s", scenes: [{ id: "scene", beats: [{ id: "beat" }] }] },
        sceneIndex: 0,
        beatIndex: 0,
        error: unprintable,
      }).message,
    ).toBe("문자열로 바꿀 수 없는 예외");
  });

  it("대본 위치와 예외 메시지를 담는다", () => {
    expect(
      createLecturePlaybackFailureLogEvent({
        script: {
          id: "script-1",
          scenes: [{ id: "scene-1", beats: [{ id: "a" }, { id: "b" }] }],
        },
        sceneIndex: 0,
        beatIndex: 1,
        error: "문자열 예외",
      }),
    ).toEqual({
      type: "lecture-playback-failure",
      level: "error",
      scriptId: "script-1",
      sceneIndex: 0,
      beatIndex: 1,
      sceneId: "scene-1",
      beatId: "b",
      message: "문자열 예외",
    });
  });
});

describe("logLectureEvent", () => {
  const infoEvent = compile(
    createScenario([[{ intent: "introduce", roles: { subject: "1" } }]]),
  );
  const errorEvent: LectureLogEvent = createLecturePlaybackFailureLogEvent({
    script: { id: "s", scenes: [{ id: "scene", beats: [{ id: "beat" }] }] },
    sceneIndex: 0,
    beatIndex: 0,
    error: new Error("실패"),
  });

  it("넣은 sink로 보낸다", () => {
    const sink = vi.fn();
    setLectureLogSink(sink);

    logLectureEvent(infoEvent);

    expect(sink).toHaveBeenCalledExactlyOnceWith(infoEvent);
  });

  it("async sink의 Promise가 거부돼도 처리되지 않은 거부를 남기지 않는다", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const failure = new Error("전송 실패");
    setLectureLogSink(() => Promise.reject(failure));

    expect(() => logLectureEvent(infoEvent)).not.toThrow();
    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        "강의 로그를 보내지 못했습니다.",
        failure,
      ),
    );
  });

  it("sink가 실패해도 예외를 던지지 않는다", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    setLectureLogSink(() => {
      throw new Error("수집 실패");
    });

    expect(() => logLectureEvent(infoEvent)).not.toThrow();
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("기본 sink는 개발 환경이 아니면 오류만 콘솔에 찍는다", () => {
    const consoleInfo = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logLectureEvent(infoEvent);
    logLectureEvent(errorEvent);

    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledExactlyOnceWith(
      "[lecture] lecture-playback-failure",
      errorEvent,
    );
  });
});
