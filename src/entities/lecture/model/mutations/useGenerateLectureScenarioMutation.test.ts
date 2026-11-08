import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { isAxiosError } from "axios";
import { server } from "@/src/tests/mocks/server";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import {
  LECTURE_ERROR_CODE,
  LECTURE_SCENARIO_SCHEMA_VERSION,
  type LectureRepairRequest,
  useGenerateLectureScenarioMutation,
} from "@/src/entities/lecture";

const RESPONSE_DATA = {
  responseText: '{"scenarioSchemaVersion":1}',
  model: "gpt-4o-mini-2024-07-18",
  promptVersion: "lecture-v1",
  usage: { inputTokens: 1200, outputTokens: 340 },
  attemptCount: 2,
};

const TREE_OUTLINE = "- [1] 척추동물\n  - [2] 포유류\n  - [3] 파충류";

/*
요청 body를 붙잡고 정해진 응답을 돌려주는 핸들러를 끼운다.
*/
const captureRequest = () => {
  const captured: { body: unknown } = { body: null };

  server.use(
    http.post("*/api/lecture-request", async ({ request }) => {
      captured.body = await request.json();

      return HttpResponse.json({
        isSuccess: true,
        code: "COMMON200",
        message: "성공입니다.",
        data: RESPONSE_DATA,
      });
    }),
  );

  return captured;
};

const renderMutation = () => {
  const { wrapper } = createQueryWrapper();

  return renderHook(() => useGenerateLectureScenarioMutation(), { wrapper })
    .result;
};

describe("useGenerateLectureScenarioMutation", () => {
  it("트리 ID를 숫자로 바꾸고 프론트의 시나리오 스키마 버전을 싣는다", async () => {
    const captured = captureRequest();
    const result = renderMutation();

    result.current.mutate({
      treeId: "12",
      request: "포유류와 파충류를 비교해 줘",
      treeOutline: TREE_OUTLINE,
      repair: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(captured.body).toEqual({
      treeId: 12,
      request: "포유류와 파충류를 비교해 줘",
      treeOutline: TREE_OUTLINE,
      scenarioSchemaVersion: LECTURE_SCENARIO_SCHEMA_VERSION,
      repair: null,
    });
  });

  /*
  repair 요청은 getLectureRepairRequest가 백엔드 계약에 맞춰 만들므로 고치지 않고 그대로 보내야 한다.
  */
  it("repair 요청을 그대로 싣는다", async () => {
    const captured = captureRequest();
    const result = renderMutation();
    const repair: LectureRepairRequest = {
      attempt: 1,
      previousResponseText: '{"scenes":[]}',
      issues: [
        {
          stage: "node",
          path: "$.scenes[0].beats[0].cues[0].roles.subject",
          message: "트리에 없는 노드(999)입니다.",
        },
      ],
      omittedIssueCount: 0,
    };

    result.current.mutate({
      treeId: "12",
      request: "포유류와 파충류를 비교해 줘",
      treeOutline: TREE_OUTLINE,
      repair,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(captured.body).toMatchObject({ repair });
  });

  it("응답의 모델 응답 원본과 측정값을 돌려준다", async () => {
    captureRequest();
    const result = renderMutation();

    result.current.mutate({
      treeId: "12",
      request: "포유류와 파충류를 비교해 줘",
      treeOutline: TREE_OUTLINE,
      repair: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(RESPONSE_DATA);
  });

  it("백엔드 오류 코드를 응답 본문으로 받을 수 있다", async () => {
    server.use(
      http.post("*/api/lecture-request", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: LECTURE_ERROR_CODE.RESPONSE_TRUNCATED,
            message: "AI 모델 응답이 길이 상한에 걸려 잘렸습니다.",
            data: null,
          },
          { status: 502 },
        ),
      ),
    );
    const result = renderMutation();

    result.current.mutate({
      treeId: "12",
      request: "포유류와 파충류를 비교해 줘",
      treeOutline: TREE_OUTLINE,
      repair: null,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const { error } = result.current;
    expect(isAxiosError(error) && error.response?.data.code).toBe(
      LECTURE_ERROR_CODE.RESPONSE_TRUNCATED,
    );
  });
});
