import { renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { RAW_CREATED_TREE_DATA } from "@/src/tests/mocks/data";
import { server } from "@/src/tests/mocks/server";
import { useFillWorkspaceTree } from "./useFillWorkspaceTree";

/*
실패 응답을 상태 코드, 에러 코드, 문구까지 지정해 끼운다.
*/
const respondWithError = (status: number, code: string, message: string) => {
  server.use(
    http.post("*/api/workspaces/:workspaceId/tree-request", () =>
      HttpResponse.json(
        { isSuccess: false, code, message, data: null },
        { status },
      ),
    ),
  );
};

describe("useFillWorkspaceTree", () => {
  const alertSpy = vi.spyOn(window, "alert");
  const consoleErrorSpy = vi.spyOn(console, "error");

  beforeEach(() => {
    alertSpy.mockImplementation(() => {});
    consoleErrorSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockReset();
    consoleErrorSpy.mockReset();
  });

  it("성공하면 안내 없이 resolve한다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    await result.current.fillWorkspaceTree("자료구조 트리 만들어줘");

    expect(alertSpy).not.toHaveBeenCalled();
  });

  /*
  서버 문구는 규칙을 말하지만, 사용자는 빈 화면에서 요청했으므로 무엇이 바뀌었는지를 알린다.
  */
  it("다른 곳에서 먼저 채웠으면 그 사실을 안내하고 reject한다", async () => {
    respondWithError(
      409,
      "CHAT409-1",
      "이 워크스페이스에는 이미 노드가 있는 트리가 있습니다.",
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    await expect(
      result.current.fillWorkspaceTree("자료구조 트리 만들어줘"),
    ).rejects.toThrow();

    expect(alertSpy).toHaveBeenCalledWith(
      "다른 곳에서 이미 트리를 만들었습니다. 만들어진 트리를 불러옵니다.",
    );
  });

  it("4xx는 서버 문구를 그대로 안내한다", async () => {
    respondWithError(400, "CHAT400-5", "파일 크기는 25MB를 넘을 수 없습니다.");

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    await expect(
      result.current.fillWorkspaceTree("자료구조 트리 만들어줘"),
    ).rejects.toThrow();

    expect(alertSpy).toHaveBeenCalledWith(
      "파일 크기는 25MB를 넘을 수 없습니다.",
    );
  });

  it("5xx는 다시 시도를 권하는 문구로 안내한다", async () => {
    respondWithError(504, "CHAT504-1", "LLM 응답 시간이 초과되었습니다.");

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    await expect(
      result.current.fillWorkspaceTree("자료구조 트리 만들어줘"),
    ).rejects.toThrow();

    expect(alertSpy).toHaveBeenCalledWith(
      "트리를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });

  /*
  두 번째 요청이 나가면 서버가 409로 거절하더라도 LLM 응답을 기다린 뒤라 대기와 과금이 겹친다.
  */
  it("진행 중에 다시 부르면 요청을 보내지 않고 reject한다", async () => {
    let requestCount = 0;

    server.use(
      http.post("*/api/workspaces/:workspaceId/tree-request", async () => {
        requestCount += 1;
        await delay(20);

        return HttpResponse.json(
          {
            isSuccess: true,
            code: "CHAT201-1",
            message: "트리가 성공적으로 생성되었습니다.",
            data: { ...RAW_CREATED_TREE_DATA, workspaceId: 9 },
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    const first = result.current.fillWorkspaceTree("자료구조 트리 만들어줘");

    await expect(
      result.current.fillWorkspaceTree("자료구조 트리 만들어줘"),
    ).rejects.toThrow();

    await first;

    expect(requestCount).toBe(1);
    await waitFor(() =>
      expect(result.current.isFillingWorkspaceTree).toBe(false),
    );
  });

  /*
  요청은 화면을 벗어나도 mutation cache에서 계속 진행된다. 돌아온 화면이 새 hook으로 다시 보내면 LLM이 두 번 돈다.
  */
  it("생성 중에 화면을 벗어났다 돌아와도 진행 중으로 보고 다시 보내지 않는다", async () => {
    let requestCount = 0;

    server.use(
      http.post("*/api/workspaces/:workspaceId/tree-request", async () => {
        requestCount += 1;
        await delay(50);

        return HttpResponse.json(
          {
            isSuccess: true,
            code: "CHAT201-1",
            message: "트리가 성공적으로 생성되었습니다.",
            data: { ...RAW_CREATED_TREE_DATA, workspaceId: 9 },
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper } = createQueryWrapper();
    const firstView = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    const first = firstView.result.current.fillWorkspaceTree("자료구조 트리");
    firstView.unmount();

    const { result } = renderHook(
      () => useFillWorkspaceTree({ workspaceId: "9" }),
      { wrapper },
    );

    expect(result.current.isFillingWorkspaceTree).toBe(true);
    await expect(
      result.current.fillWorkspaceTree("자료구조 트리"),
    ).rejects.toThrow();

    await first;

    expect(requestCount).toBe(1);
    await waitFor(() =>
      expect(result.current.isFillingWorkspaceTree).toBe(false),
    );
  });

  it("다른 워크스페이스의 생성 요청은 진행 중으로 보지 않는다", async () => {
    server.use(
      http.post("*/api/workspaces/:workspaceId/tree-request", async () => {
        await delay(50);

        return HttpResponse.json(
          {
            isSuccess: true,
            code: "CHAT201-1",
            message: "트리가 성공적으로 생성되었습니다.",
            data: { ...RAW_CREATED_TREE_DATA, workspaceId: 9 },
          },
          { status: 201 },
        );
      }),
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => ({
        workspace9: useFillWorkspaceTree({ workspaceId: "9" }),
        workspace10: useFillWorkspaceTree({ workspaceId: "10" }),
      }),
      { wrapper },
    );

    const pending = result.current.workspace9.fillWorkspaceTree("자료구조");

    await waitFor(() =>
      expect(result.current.workspace9.isFillingWorkspaceTree).toBe(true),
    );
    expect(result.current.workspace10.isFillingWorkspaceTree).toBe(false);

    await pending;
  });
});
