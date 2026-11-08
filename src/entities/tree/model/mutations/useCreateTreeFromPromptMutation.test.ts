import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { treeQueryKeys } from "../queryKeys";
import { useCreateTreeFromPromptMutation } from "./useCreateTreeFromPromptMutation";

describe("useCreateTreeFromPromptMutation", () => {
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
});
