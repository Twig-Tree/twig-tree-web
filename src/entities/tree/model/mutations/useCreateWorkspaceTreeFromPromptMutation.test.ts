import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { delay, http, HttpResponse } from "msw";
import { afterEach, describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { treeApi } from "../../api/treeApi";
import { treeQueryKeys } from "../queryKeys";
import { useCreateWorkspaceTreeFromPromptMutation } from "./useCreateWorkspaceTreeFromPromptMutation";

const WORKSPACE_DETAIL = {
  id: "9",
  name: "빈 워크스페이스",
  updatedAt: "2026-11-12T00:00:00.000000Z",
  treeId: null,
};

describe("useCreateWorkspaceTreeFromPromptMutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
  응답을 기다리는 동안 시작된 상세 재조회가 늦게 끝나 treeId: null로 되돌리면 편집기가 만들어진 트리를 불러오지 못한다.
  */
  it("진행 중이던 상세 조회가 늦게 끝나도 채운 treeId를 덮어쓰지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("9"), WORKSPACE_DETAIL);

    /*
    생성 응답보다 늦게 끝나는 상세 조회. 서버 저장 전에 시작했으므로 treeId: null을 돌려준다.
    */
    void queryClient.prefetchQuery({
      queryKey: workspaceQueryKeys.detail("9"),
      queryFn: async () => {
        await delay(100);
        return WORKSPACE_DETAIL;
      },
    });

    const { result } = renderHook(
      () => useCreateWorkspaceTreeFromPromptMutation(),
      { wrapper },
    );

    result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await delay(150);

    expect(
      queryClient.getQueryData(workspaceQueryKeys.detail("9")),
    ).toMatchObject({ treeId: "30" });
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

  /*
  msw는 XMLHttpRequest의 timeout을 흉내 내지 않아 API 함수가 timeout 오류로 reject하게 한다.
  */
  describe("응답을 기다리다 프론트가 끊으면", () => {
    const mockCreateWorkspaceTreeFromPromptError = (error: Error) =>
      vi
        .spyOn(treeApi, "createWorkspaceTreeFromPrompt")
        .mockRejectedValue(error);

    it("워크스페이스 상세, 트리 조회, 최신순 목록 캐시를 낡음으로 표시한다", async () => {
      mockCreateWorkspaceTreeFromPromptError(
        new AxiosError("timeout of 180000ms exceeded", AxiosError.ETIMEDOUT),
      );

      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(
        workspaceQueryKeys.detail("9"),
        WORKSPACE_DETAIL,
      );
      queryClient.setQueryData(treeQueryKeys.detail("30"), []);
      queryClient.setQueryData(workspaceQueryKeys.recent(), []);

      const { result } = renderHook(
        () => useCreateWorkspaceTreeFromPromptMutation(),
        { wrapper },
      );

      result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        queryClient.getQueryState(workspaceQueryKeys.detail("9"))
          ?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(treeQueryKeys.detail("30"))?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
      ).toBe(true);
    });

    /*
    끊긴 시점에는 서버가 아직 저장 전일 가능성이 높다. 바로 다시 받으면 빈 상세가 새것으로 남는다.
    */
    it("화면에 걸린 워크스페이스 상세도 바로 다시 조회하지 않는다", async () => {
      mockCreateWorkspaceTreeFromPromptError(
        new AxiosError("timeout of 180000ms exceeded", AxiosError.ETIMEDOUT),
      );

      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(
        workspaceQueryKeys.detail("9"),
        WORKSPACE_DETAIL,
      );
      const getWorkspaceDetail = vi.fn().mockResolvedValue(WORKSPACE_DETAIL);

      const { result } = renderHook(
        () => ({
          mutation: useCreateWorkspaceTreeFromPromptMutation(),
          detail: useQuery({
            queryKey: workspaceQueryKeys.detail("9"),
            queryFn: getWorkspaceDetail,
            staleTime: Infinity,
          }),
        }),
        { wrapper },
      );

      result.current.mutation.mutate({
        workspaceId: "9",
        message: "자료구조 트리",
      });

      await waitFor(() => expect(result.current.mutation.isError).toBe(true));

      expect(
        queryClient.getQueryState(workspaceQueryKeys.detail("9"))
          ?.isInvalidated,
      ).toBe(true);
      expect(getWorkspaceDetail).not.toHaveBeenCalled();
    });

    it("브라우저가 요청을 중단한 경우는 캐시를 건드리지 않는다", async () => {
      mockCreateWorkspaceTreeFromPromptError(
        new AxiosError("Request aborted", AxiosError.ECONNABORTED),
      );

      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(
        workspaceQueryKeys.detail("9"),
        WORKSPACE_DETAIL,
      );

      const { result } = renderHook(
        () => useCreateWorkspaceTreeFromPromptMutation(),
        { wrapper },
      );

      result.current.mutate({ workspaceId: "9", message: "자료구조 트리" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        queryClient.getQueryState(workspaceQueryKeys.detail("9"))
          ?.isInvalidated,
      ).toBe(false);
    });
  });
});
