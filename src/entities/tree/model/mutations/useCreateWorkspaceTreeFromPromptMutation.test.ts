import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { treeQueryKeys } from "../queryKeys";
import { useCreateWorkspaceTreeFromPromptMutation } from "./useCreateWorkspaceTreeFromPromptMutation";

const WORKSPACE_DETAIL = {
  id: "9",
  name: "빈 워크스페이스",
  updatedAt: "2026-11-12T00:00:00.000000Z",
  treeId: null,
};

describe("useCreateWorkspaceTreeFromPromptMutation", () => {
  it("경로의 워크스페이스 ID를 숫자로 바꿔 지시문과 함께 보낸다", async () => {
    let requestedUrl: string | null = null;
    let requestedBody: unknown = null;

    server.use(
      http.post(
        "*/api/workspaces/:workspaceId/tree-request",
        async ({ request }) => {
          requestedUrl = new URL(request.url).pathname;
          requestedBody = await request.json();

          return HttpResponse.json(
            {
              isSuccess: true,
              code: "CHAT201-1",
              message: "트리가 성공적으로 생성되었습니다.",
              data: { treeId: 30, workspaceId: 9, nodes: [] },
            },
            { status: 201 },
          );
        },
      ),
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestedUrl).toBe("/api/workspaces/9/tree-request");
    expect(requestedBody).toEqual({
      message: "자료구조 트리",
      provider: "OPENAI",
    });
    expect(result.current.data).toEqual({ workspaceId: "9", treeId: "30" });
  });

  /*
  트리가 없던 워크스페이스는 상세 캐시의 treeId가 채워져야 편집기가 새 트리를 조회한다.
  */
  it("워크스페이스 상세 캐시의 treeId를 채운다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("9"), WORKSPACE_DETAIL);

    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(workspaceQueryKeys.detail("9"))).toEqual({
      ...WORKSPACE_DETAIL,
      treeId: "30",
    });
  });

  /*
  노드 없는 트리가 있던 워크스페이스는 treeId가 그대로라, 트리 조회를 무효화해야 노드를 다시 받는다.
  응답의 노드에는 version이 없으므로 캐시에 직접 넣지 않는다.
  */
  it("응답의 노드를 넣지 않고 트리 조회 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(treeQueryKeys.detail("30"), []);

    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const treeState = queryClient.getQueryState(treeQueryKeys.detail("30"));

    expect(treeState?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(treeQueryKeys.detail("30"))).toEqual([]);
  });

  /*
  서버가 워크스페이스 updatedAt을 갱신하므로 최신순 목록의 순서가 바뀐다.
  */
  it("최신순 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.recent(), []);

    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
    ).toBe(true);
  });

  /*
  다른 곳에서 먼저 채운 트리를 보이게 한다. 거절 응답에 treeId가 없어 트리 조회는 모두 무효화한다.
  */
  it("이미 노드가 있다고 거절되면 워크스페이스 상세와 트리 조회 캐시를 무효화한다", async () => {
    server.use(
      http.post("*/api/workspaces/:workspaceId/tree-request", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "CHAT409-1",
            message: "이 워크스페이스에는 이미 노드가 있는 트리가 있습니다.",
            data: null,
          },
          { status: 409 },
        ),
      ),
    );

    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("9"), WORKSPACE_DETAIL);
    queryClient.setQueryData(treeQueryKeys.detail("30"), []);

    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.detail("9"))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(treeQueryKeys.detail("30"))?.isInvalidated,
    ).toBe(true);
  });

  it("다른 이유로 실패하면 캐시를 건드리지 않는다", async () => {
    server.use(
      http.post("*/api/workspaces/:workspaceId/tree-request", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "CHAT504-1",
            message: "LLM 응답 시간이 초과되었습니다.",
            data: null,
          },
          { status: 504 },
        ),
      ),
    );

    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("9"), WORKSPACE_DETAIL);

    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.detail("9"))?.isInvalidated,
    ).toBe(false);
  });
});
