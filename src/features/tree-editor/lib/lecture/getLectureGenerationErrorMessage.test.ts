import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { LECTURE_ERROR_CODE } from "@/src/entities/lecture";
import { getLectureGenerationErrorMessage } from "./getLectureGenerationErrorMessage";

const createResponseError = (code: string) =>
  new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status: 502,
    statusText: "Bad Gateway",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { isSuccess: false, code, message: "", data: null },
  });

describe("getLectureGenerationErrorMessage", () => {
  it("성공하면 문구가 없다", () => {
    expect(
      getLectureGenerationErrorMessage({
        status: "success",
        treeId: "12",
        script: { id: "s", title: "t", scenes: [] },
        scenario: {
          scenarioSchemaVersion: 1,
          recipeRegistryVersion: 1,
          title: "t",
          scenes: [],
        },
        sourceMap: {},
        warnings: [],
      }),
    ).toBeNull();
  });

  it("json 단계 실패는 다시 시도를, 그 밖의 실패는 요청을 바꾸라고 안내한다", () => {
    expect(
      getLectureGenerationErrorMessage({
        status: "failure",
        failedStep: "json",
        issues: [],
      }),
    ).toContain("다시 시도해 주세요");
    expect(
      getLectureGenerationErrorMessage({
        status: "failure",
        failedStep: "compile",
        issues: [],
      }),
    ).toContain("요청을 바꿔");
  });

  it("프론트가 먼저 끊은 요청과 백엔드 오류 코드를 구분한다", () => {
    expect(
      getLectureGenerationErrorMessage({
        status: "request-error",
        error: new AxiosError("timeout", "ECONNABORTED"),
      }),
    ).toContain("너무 오래 걸립니다");
    expect(
      getLectureGenerationErrorMessage({
        status: "request-error",
        error: createResponseError(LECTURE_ERROR_CODE.MODEL_REFUSED),
      }),
    ).toContain("요청을 바꿔");
    expect(
      getLectureGenerationErrorMessage({
        status: "request-error",
        error: createResponseError(LECTURE_ERROR_CODE.LLM_CALL_FAILED),
      }),
    ).toBe("강의를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
  });
});
