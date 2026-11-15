import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { http, HttpResponse } from "msw";
import { afterEach, describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { treeApi } from "../../api/treeApi";
import { treeQueryKeys } from "../queryKeys";
import { useCreateTreeFromPromptMutation } from "./useCreateTreeFromPromptMutation";

describe("useCreateTreeFromPromptMutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("서버가 확정한 워크스페이스·트리 ID를 돌려준다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.workspaceId).toBe("31");
    expect(result.current.data?.treeId).toBe("30");
  });

  /*
  응답의 노드에는 version이 없다. 캐시에 넣으면 이동한 화면이 재조회 없이 읽어 이름·메모 저장이 version 없이 나간다.
  */
  it("응답의 노드를 트리 캐시에 넣지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData(treeQueryKeys.detail("30")),
    ).toBeUndefined();
  });

  it("루트 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
          ?.isInvalidated,
      ).toBe(true),
    );
  });

  /*
  새 워크스페이스는 항상 루트에 생기므로 폴더 안 목록까지 다시 조회할 이유가 없다.
  */
  it("폴더 안 워크스페이스 목록 캐시는 건드리지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("3"), []);

    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder("3"))
        ?.isInvalidated,
    ).toBe(false);
  });

  /*
  프롬프트로 만든 워크스페이스도 최신순 목록 맨 위에 생긴다.
  */
  it("최신순 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.recent(), []);

    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
      ).toBe(true),
    );
  });

  /*
  msw는 XMLHttpRequest의 timeout을 흉내 내지 않아 API 함수가 timeout 오류로 reject하게 한다.
  mutationFn은 렌더 시점에 API 함수를 읽으므로 렌더 전에 바꾼다.
  */
  describe("응답을 기다리다 프론트가 끊으면", () => {
    const mockCreateTreeFromPromptError = (error: Error) =>
      vi.spyOn(treeApi, "createTreeFromPrompt").mockRejectedValue(error);

    it("루트 워크스페이스 목록과 최신순 목록 캐시를 낡음으로 표시한다", async () => {
      mockCreateTreeFromPromptError(
        new AxiosError("timeout of 180000ms exceeded", AxiosError.ETIMEDOUT),
      );

      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);
      queryClient.setQueryData(workspaceQueryKeys.recent(), []);

      const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
        wrapper,
      });

      result.current.mutate({ message: "자료구조 트리 만들어줘" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
          ?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
      ).toBe(true);
    });

    /*
    끊긴 시점에는 서버가 아직 저장 전일 가능성이 높다. 바로 다시 받으면 옛 목록이 새것으로 남는다.
    */
    it("화면에 걸린 목록도 바로 다시 조회하지 않는다", async () => {
      mockCreateTreeFromPromptError(
        new AxiosError("timeout of 180000ms exceeded", AxiosError.ETIMEDOUT),
      );

      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(workspaceQueryKeys.recent(), []);
      const getRecentWorkspaces = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(
        () => ({
          mutation: useCreateTreeFromPromptMutation(),
          recent: useQuery({
            queryKey: workspaceQueryKeys.recent(),
            queryFn: getRecentWorkspaces,
            staleTime: Infinity,
          }),
        }),
        { wrapper },
      );

      result.current.mutation.mutate({ message: "자료구조 트리 만들어줘" });

      await waitFor(() => expect(result.current.mutation.isError).toBe(true));

      expect(
        queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
      ).toBe(true);
      expect(getRecentWorkspaces).not.toHaveBeenCalled();
    });

    it("브라우저가 요청을 중단한 경우는 캐시를 건드리지 않는다", async () => {
      mockCreateTreeFromPromptError(
        new AxiosError("Request aborted", AxiosError.ECONNABORTED),
      );

      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(workspaceQueryKeys.recent(), []);

      const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
        wrapper,
      });

      result.current.mutate({ message: "자료구조 트리 만들어줘" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
      ).toBe(false);
    });
  });

  /*
  서버가 저장하지 않았다고 답한 경우다.
  */
  it("서버가 오류로 답하면 캐시를 건드리지 않는다", async () => {
    server.use(
      http.post("*/api/tree-request", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "CHAT504-1",
            message: "AI 모델 응답 시간이 초과되었습니다.",
            data: null,
          },
          { status: 504 },
        ),
      ),
    );

    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.recent(), []);

    const { result } = renderHook(() => useCreateTreeFromPromptMutation(), {
      wrapper,
    });

    result.current.mutate({ message: "자료구조 트리 만들어줘" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
    ).toBe(false);
  });
});
