import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type LectureScript } from "@/src/entities/lecture";
import { requestConfirm } from "@/src/shared/ui/confirm-dialog";
import { useGeneratedLectureStore } from "./generatedLectureStore";
import {
  useGenerateLecture,
  type GenerateLectureResult,
} from "./useGenerateLecture";
import { useLectureGeneration } from "./useLectureGeneration";

vi.mock("@/src/shared/ui/confirm-dialog", () => ({ requestConfirm: vi.fn() }));
vi.mock("./useGenerateLecture", () => ({ useGenerateLecture: vi.fn() }));

const requestConfirmMock = vi.mocked(requestConfirm);
const generateLectureMock =
  vi.fn<() => Promise<GenerateLectureResult | null>>();

const SCRIPT: LectureScript = {
  id: "generated-1",
  title: "만든 강의",
  scenes: [],
};

/*
요청과 컴파일은 useGenerateLecture의 테스트가 본다. 여기서는 그 결과를 받아 무엇을 하는지만 본다.
*/
const SUCCESS_RESULT: GenerateLectureResult = {
  status: "success",
  treeId: "12",
  script: SCRIPT,
  scenario: {
    scenarioSchemaVersion: 1,
    recipeRegistryVersion: 1,
    title: "만든 강의",
    scenes: [],
  },
  sourceMap: {} as never,
  warnings: [],
};

const renderLectureGeneration = (
  params: Parameters<typeof useLectureGeneration>[0],
) => renderHook(() => useLectureGeneration(params));

beforeEach(() => {
  vi.mocked(useGenerateLecture).mockReturnValue({
    generateLecture: generateLectureMock,
    isGenerating: false,
  });
  useGeneratedLectureStore.setState({
    scriptByTreeId: {},
    latestScriptIdByTreeId: { "12": SCRIPT.id }, // useGenerateLecture가 요청을 시작하며 남기는 기록
  });
});

afterEach(() => {
  generateLectureMock.mockReset();
  requestConfirmMock.mockReset();
});

describe("useLectureGeneration", () => {
  it("생성한 강의가 없으면 묻지 않고 바로 만들어 트리의 생성 강의로 보관한다", async () => {
    generateLectureMock.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderLectureGeneration({ hasGeneratedScript: false });

    await act(() => result.current.handleGenerateLecture());

    expect(requestConfirmMock).not.toHaveBeenCalled();
    expect(generateLectureMock).toHaveBeenCalledOnce();
    expect(useGeneratedLectureStore.getState().scriptByTreeId["12"]).toBe(
      SCRIPT,
    );
    expect(result.current.errorMessage).toBeNull();
  });

  it("생성한 강의가 있으면 새로 만들지 확인한 뒤 만든다", async () => {
    requestConfirmMock.mockResolvedValue(true);
    generateLectureMock.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderLectureGeneration({ hasGeneratedScript: true });

    await act(() => result.current.handleGenerateLecture());

    expect(requestConfirmMock).toHaveBeenCalledExactlyOnceWith({
      title: "강의를 새로 만들까요?",
      description:
        "지금 강의는 새로 만든 강의로 바뀝니다. 최대 2분쯤 걸립니다.",
      confirmLabel: "새로 만들기",
    });
    expect(generateLectureMock).toHaveBeenCalledOnce();
  });

  it("확인을 취소하면 요청하지 않는다", async () => {
    requestConfirmMock.mockResolvedValue(false);
    const { result } = renderLectureGeneration({ hasGeneratedScript: true });

    await act(() => result.current.handleGenerateLecture());

    expect(generateLectureMock).not.toHaveBeenCalled();
  });

  it("확인 창이 떠 있는 동안 다시 누르면 확인 창을 또 열지 않는다", async () => {
    let answer: (isConfirmed: boolean) => void = () => {};
    requestConfirmMock.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    generateLectureMock.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderLectureGeneration({ hasGeneratedScript: true });

    await act(async () => {
      const first = result.current.handleGenerateLecture();
      const second = result.current.handleGenerateLecture();
      answer(true);
      await Promise.all([first, second]);
    });

    expect(requestConfirmMock).toHaveBeenCalledOnce();
    expect(generateLectureMock).toHaveBeenCalledOnce();
  });

  it("생성 중이면 확인 창도 요청도 시작하지 않는다", async () => {
    vi.mocked(useGenerateLecture).mockReturnValue({
      generateLecture: generateLectureMock,
      isGenerating: true,
    });
    const { result } = renderLectureGeneration({ hasGeneratedScript: true });

    await act(() => result.current.handleGenerateLecture());

    expect(requestConfirmMock).not.toHaveBeenCalled();
    expect(generateLectureMock).not.toHaveBeenCalled();
  });

  it("실패하면 안내 문구를 남기고, 다시 시도하면 문구를 지운다", async () => {
    generateLectureMock.mockResolvedValueOnce({
      status: "failure",
      failedStep: "json",
      issues: [],
    });
    const { result } = renderLectureGeneration({ hasGeneratedScript: false });

    await act(() => result.current.handleGenerateLecture());

    expect(result.current.errorMessage).toBe(
      "AI 응답을 읽지 못했습니다. 다시 시도해 주세요.",
    );

    generateLectureMock.mockResolvedValueOnce(SUCCESS_RESULT);
    await act(() => result.current.handleGenerateLecture());

    expect(result.current.errorMessage).toBeNull();
  });

  it("트리를 검사해 요청을 보내지 않은 이유를 그대로 안내한다", async () => {
    generateLectureMock.mockResolvedValue({
      status: "invalid",
      message: "트리를 불러온 뒤에 다시 시도해 주세요.",
    });
    const { result } = renderLectureGeneration({ hasGeneratedScript: false });

    await act(() => result.current.handleGenerateLecture());

    expect(result.current.errorMessage).toBe(
      "트리를 불러온 뒤에 다시 시도해 주세요.",
    );
    expect(useGeneratedLectureStore.getState().scriptByTreeId).toEqual({});
  });
});
