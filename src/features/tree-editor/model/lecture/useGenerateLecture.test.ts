import { http, HttpResponse } from "msw";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LECTURE_GENERATION_REQUEST,
  setLectureLogSink,
  type LectureLogEvent,
  type LectureScenario,
} from "@/src/entities/lecture";
import { server } from "@/src/tests/mocks/server";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { createEditorNode } from "../../lib/add-node/createEditorNode";
import { useTreeStore } from "../treeStore";
import { useGenerateLecture } from "./useGenerateLecture";

const createNode = (clientId: string, serverId: string | null) =>
  createEditorNode({
    clientId,
    serverId,
    label: clientId,
    orderIndex: 0,
    x: 0,
    y: 0,
  });

/*
c1(s1) → c2(s2), c3(s3)
*/
const NODES = [
  createNode("c1", "1"),
  createNode("c2", "2"),
  createNode("c3", "3"),
];
const EDGES = [
  { id: "c1-c2", source: "c1", target: "c2" },
  { id: "c1-c3", source: "c1", target: "c3" },
];

const createScenarioText = (subject: string) =>
  JSON.stringify({
    scenarioSchemaVersion: 1,
    recipeRegistryVersion: 1,
    title: "편집기 강의",
    scenes: [
      {
        id: "scene-1",
        nodeId: "1",
        beats: [
          {
            id: "beat-1",
            narration: { text: "이 노드를 소개합니다." },
            cues: [{ intent: "introduce", roles: { subject } }],
          },
        ],
      },
    ],
  } satisfies LectureScenario);

const VALID_RESPONSE = createScenarioText("2");
const MISSING_NODE_RESPONSE = createScenarioText("999");
const BROKEN_JSON_RESPONSE = '{"scenarioSchemaVersion":1,';

/*
요청 body를 차례로 모으고, 준비한 모델 응답을 순서대로 돌려준다.
*/
const mockResponses = (responseTexts: string[]) => {
  const bodies: Record<string, unknown>[] = [];

  server.use(
    http.post("*/api/lecture-request", async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);

      return HttpResponse.json({
        isSuccess: true,
        code: "COMMON200",
        message: "성공입니다.",
        data: {
          responseText: responseTexts[bodies.length - 1],
          model: "gpt-4o-mini-2024-07-18",
          promptVersion: "lecture-v1",
          usage: { inputTokens: 1200, outputTokens: 340 },
          attemptCount: 1,
        },
      });
    }),
  );

  return bodies;
};

const logs: LectureLogEvent[] = [];

const renderGenerateLecture = () => {
  const { wrapper } = createQueryWrapper();

  return renderHook(() => useGenerateLecture(), { wrapper }).result;
};

beforeEach(() => {
  useTreeStore.setState({ treeId: "12", nodes: NODES, edges: EDGES });
  logs.length = 0;
  setLectureLogSink((event) => {
    logs.push(event);
  });
});

afterEach(() => {
  useTreeStore.getState().resetTree();
  setLectureLogSink(null);
});

describe("useGenerateLecture", () => {
  it("편집기 트리의 outline을 고정 요청 문장과 함께 보내고 서버 ID 대본을 돌려준다", async () => {
    const bodies = mockResponses([VALID_RESPONSE]);
    const result = renderGenerateLecture();

    const generated = await act(() => result.current.generateLecture());

    expect(bodies).toEqual([
      {
        treeId: 12,
        request: LECTURE_GENERATION_REQUEST,
        treeOutline: "- [1] c1\n  - [2] c2\n  - [3] c3",
        scenarioSchemaVersion: 1,
        repair: null,
      },
    ]);
    expect(generated).toMatchObject({ status: "success" });
    if (generated?.status !== "success") return;
    expect(generated.script.scenes[0].nodeId).toBe("1");
    expect(logs).toEqual([
      expect.objectContaining({
        type: "lecture-generation",
        success: true,
        repairAttempt: 0,
      }),
    ]);
  });

  it("컴파일에 실패하면 문제를 실어 repair를 보내고, 고친 응답으로 대본을 만든다", async () => {
    const bodies = mockResponses([MISSING_NODE_RESPONSE, VALID_RESPONSE]);
    const result = renderGenerateLecture();

    const generated = await act(() => result.current.generateLecture());

    expect(bodies).toHaveLength(2);
    expect(bodies[1].repair).toEqual({
      attempt: 1,
      previousResponseText: MISSING_NODE_RESPONSE,
      issues: [
        expect.objectContaining({
          stage: "node",
          path: "$.scenes[0].beats[0].cues[0].roles.subject",
        }),
      ],
      omittedIssueCount: 0,
    });
    expect(generated).toMatchObject({ status: "success" });

    /*
    두 응답이 한 생성에 속하는지 로그에서 알 수 있어야 한다.
    */
    expect(logs).toMatchObject([
      { success: false, failedStep: "compile", repairAttempt: 0 },
      { success: true, repairAttempt: 1 },
    ]);
    expect(logs[0].scriptId).toBe(logs[1].scriptId);
  });

  it("repair 뒤에도 실패하면 더 보내지 않고 마지막 문제를 돌려준다", async () => {
    const bodies = mockResponses([
      MISSING_NODE_RESPONSE,
      MISSING_NODE_RESPONSE,
    ]);
    const result = renderGenerateLecture();

    const generated = await act(() => result.current.generateLecture());

    expect(bodies).toHaveLength(2);
    expect(generated).toMatchObject({
      status: "failure",
      failedStep: "compile",
      issues: [expect.objectContaining({ stage: "node" })],
    });
  });

  it("JSON으로 읽지 못한 응답은 repair하지 않는다", async () => {
    const bodies = mockResponses([BROKEN_JSON_RESPONSE, VALID_RESPONSE]);
    const result = renderGenerateLecture();

    const generated = await act(() => result.current.generateLecture());

    expect(bodies).toHaveLength(1);
    expect(generated).toMatchObject({ status: "failure", failedStep: "json" });
  });

  it("요청이 실패하면 오류를 돌려주고 생성 중 상태를 푼다", async () => {
    server.use(
      http.post("*/api/lecture-request", () =>
        HttpResponse.json(
          { isSuccess: false, code: "LECTURE504-1", message: "", data: null },
          { status: 504 },
        ),
      ),
    );
    const result = renderGenerateLecture();

    const generated = await act(() => result.current.generateLecture());

    expect(generated).toMatchObject({ status: "request-error" });
    expect(result.current.isGenerating).toBe(false);
  });

  it("저장된 노드가 없으면 요청하지 않는다", async () => {
    const bodies = mockResponses([VALID_RESPONSE]);
    const result = renderGenerateLecture();

    useTreeStore.setState({ nodes: [createNode("c9", null)], edges: [] });
    const emptyTree = await act(() => result.current.generateLecture());

    expect(emptyTree).toMatchObject({
      status: "invalid",
      message: "저장된 노드가 없어 강의를 만들 수 없습니다.",
    });
    expect(bodies).toHaveLength(0);
  });

  it("생성 중에 다시 부르면 요청을 한 번만 보낸다", async () => {
    const bodies = mockResponses([VALID_RESPONSE, VALID_RESPONSE]);
    const result = renderGenerateLecture();

    const [first, second] = await act(() =>
      Promise.all([
        result.current.generateLecture(),
        result.current.generateLecture(),
      ]),
    );

    expect(first).toMatchObject({ status: "success" });
    expect(second).toBeNull();
    expect(bodies).toHaveLength(1);
  });
});
