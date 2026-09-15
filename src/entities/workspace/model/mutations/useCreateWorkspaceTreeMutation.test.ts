import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { isAxiosError } from "axios";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceQueryKeys } from "../queryKeys";
import { useCreateWorkspaceTreeMutation } from "./useCreateWorkspaceTreeMutation";

describe("useCreateWorkspaceTreeMutation", () => {
  it("생성된 트리 ID를 문자열로 돌려준다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceTreeMutation(), {
      wrapper,
    });

    result.current.mutate("2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe("20");
  });

  it("이미 트리가 있는 워크스페이스면 409 오류가 된다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceTreeMutation(), {
      wrapper,
    });

    result.current.mutate("1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    const { error } = result.current;
    expect(isAxiosError(error) && error.response?.status).toBe(409);
  });

  it("이미 트리가 있다는 응답이면 워크스페이스 상세 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("1"), {
      id: "1",
      name: "Root Workspace",
      updatedAt: "2026-08-31T21:00:00",
      treeId: null,
    });

    const { result } = renderHook(() => useCreateWorkspaceTreeMutation(), {
      wrapper,
    });

    result.current.mutate("1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.detail("1"))
          ?.isInvalidated,
      ).toBe(true),
    );
  });

  /*
  캐시 반영 시점은 호출부가 정하므로(useSetWorkspaceTreeIdInCache) 선언부가 캐시를 먼저 바꾸면 안 된다.
  */
  it("워크스페이스 상세 캐시를 바꾸지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const workspace = {
      id: "2",
      name: "Workspace In Folder",
      updatedAt: "2026-08-30T09:00:00",
      treeId: null,
    };
    queryClient.setQueryData(workspaceQueryKeys.detail("2"), workspace);

    const { result } = renderHook(() => useCreateWorkspaceTreeMutation(), {
      wrapper,
    });

    result.current.mutate("2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(workspaceQueryKeys.detail("2"))).toEqual(
      workspace,
    );
    expect(
      queryClient.getQueryState(workspaceQueryKeys.detail("2"))?.isInvalidated,
    ).toBe(false);
  });
});
