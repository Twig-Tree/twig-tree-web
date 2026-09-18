import { renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { RAW_CREATED_TREE_DATA } from "@/src/tests/mocks/data";
import { server } from "@/src/tests/mocks/server";
import { useCreateWorkspaceFromPrompt } from "./useCreateWorkspaceFromPrompt";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

/*
실패 응답을 상태 코드와 문구까지 지정해 끼운다. 4xx와 5xx에서 안내 문구가 갈리는지 확인하는 데 쓴다.
*/
const respondWithError = (status: number, message: string) => {
  server.use(
    http.post("*/api/tree-request", () =>
      HttpResponse.json(
        { isSuccess: false, code: "CHAT400-5", message, data: null },
        { status },
      ),
    ),
  );
};

describe("useCreateWorkspaceFromPrompt", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("성공하면 만들어진 워크스페이스로 이동한다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    await result.current.createWorkspaceFromPrompt("자료구조 트리 만들어줘");

    expect(push).toHaveBeenCalledWith("/workspace/31");
  });

  /*
  첨부를 넘기면 multipart로 나가야 백엔드의 파일 핸들러가 받는다.
  */
  it("첨부를 함께 넘기면 multipart 요청으로 나간다", async () => {
    let contentType: string | null = null;

    server.use(
      http.post("*/api/tree-request", async ({ request }) => {
        contentType = request.headers.get("content-type");
        await request.formData();

        return HttpResponse.json(
          {
            isSuccess: true,
            code: "CHAT201-1",
            message: "트리가 성공적으로 생성되었습니다.",
            data: RAW_CREATED_TREE_DATA,
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    await result.current.createWorkspaceFromPrompt(
      "3단계로 정리해줘",
      new File(["본문"], "보고서.txt", { type: "text/plain" }),
    );

    expect(contentType).toContain("multipart/form-data");
    expect(push).toHaveBeenCalledWith("/workspace/31");
  });

  it("실패하면 이동하지 않고 오류를 다시 던진다", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    respondWithError(400, "파일 크기가 상한을 초과했습니다.");

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    await expect(
      result.current.createWorkspaceFromPrompt("트리 만들어줘"),
    ).rejects.toThrow();

    expect(push).not.toHaveBeenCalled();
  });

  /*
  4xx의 제약값은 백엔드 계약에서 오므로 서버 문구를 그대로 보여준다.
  */
  it("4xx는 서버가 보낸 문구를 그대로 보여준다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    respondWithError(
      400,
      "파일 크기가 상한을 초과했습니다. (txt·md 1MB, pdf·docx·hwp·hwpx 10MB)",
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    await expect(
      result.current.createWorkspaceFromPrompt("트리 만들어줘"),
    ).rejects.toThrow();

    expect(alertSpy).toHaveBeenCalledWith(
      "파일 크기가 상한을 초과했습니다. (txt·md 1MB, pdf·docx·hwp·hwpx 10MB)",
    );
  });

  /*
  5xx 문구는 무엇이 실패했는지만 알리고 다시 시도할지를 말해 주지 않아 프론트 문구로 덮는다.
  */
  it("5xx는 프론트 문구로 덮는다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    respondWithError(500, "AI 모델 호출에 실패했습니다.");

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    await expect(
      result.current.createWorkspaceFromPrompt("트리 만들어줘"),
    ).rejects.toThrow();

    expect(alertSpy).toHaveBeenCalledWith(
      "트리를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });

  /*
  전송 버튼이 잠기기 전에 두 번 눌린 경우다. 이 요청은 중복돼도 서버가 거절하지 않고
  워크스페이스를 하나 더 만들므로, 렌더를 기다리지 않는 가드로 막아야 한다.
  */
  it("요청이 끝나기 전에 다시 부르면 두 번째는 보내지 않는다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    await Promise.all([
      result.current.createWorkspaceFromPrompt("트리 만들어줘"),
      result.current.createWorkspaceFromPrompt("또 만들어줘"),
    ]);

    expect(push).toHaveBeenCalledTimes(1);
  });

  it("요청 중에는 진행 상태를 알린다", async () => {
    /*
    기본 핸들러는 즉시 답해서 진행 상태를 관찰할 틈이 없다. 응답을 늦춰 pending 구간을 만든다.
    */
    server.use(
      http.post("*/api/tree-request", async () => {
        await delay(50);

        return HttpResponse.json(
          {
            isSuccess: true,
            code: "CHAT201-1",
            message: "트리가 성공적으로 생성되었습니다.",
            data: RAW_CREATED_TREE_DATA,
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceFromPrompt(), {
      wrapper,
    });

    expect(result.current.isCreatingWorkspaceFromPrompt).toBe(false);

    const creating = result.current.createWorkspaceFromPrompt("트리 만들어줘");

    await waitFor(() =>
      expect(result.current.isCreatingWorkspaceFromPrompt).toBe(true),
    );

    await creating;

    await waitFor(() =>
      expect(result.current.isCreatingWorkspaceFromPrompt).toBe(false),
    );
  });
});
