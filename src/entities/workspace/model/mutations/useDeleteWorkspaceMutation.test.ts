import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceApi } from "../../api/workspaceApi";
import type { WorkspaceDetail } from "../types";
import { workspaceQueryKeys } from "../queryKeys";
import { useDeleteWorkspaceMutation } from "./useDeleteWorkspaceMutation";

const WORKSPACE_DETAIL: WorkspaceDetail = {
  id: "1",
  name: "Root Workspace",
  updatedAt: "2026-08-31T21:00:00",
  treeId: "10",
};

describe("useDeleteWorkspaceMutation", () => {
  /*
  folderId는 캐시를 찾는 데만 쓴다. 요청은 숫자 워크스페이스 ID로만 보낸다.
  */
  it("숫자 ID로 삭제 요청을 보낸다", async () => {
    const deleteWorkspaceSpy = vi.spyOn(workspaceApi, "deleteWorkspace");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeleteWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "2", folderId: "3" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteWorkspaceSpy).toHaveBeenCalledWith(2);
  });

  it("상세 캐시를 제거한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.detail("1"), WORKSPACE_DETAIL);

    const { result } = renderHook(() => useDeleteWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "1", folderId: null });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.detail("1")),
    ).toBeUndefined();
  });

  it("속한 폴더의 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("3"), []);

    const { result } = renderHook(() => useDeleteWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "2", folderId: "3" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.listByFolder("3"))
          ?.isInvalidated,
      ).toBe(true),
    );
  });

  /*
  다른 폴더의 목록은 이 워크스페이스와 무관하므로 건드리지 않는다.
  */
  it("다른 폴더의 워크스페이스 목록은 무효화하지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useDeleteWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "2", folderId: "3" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
        ?.isInvalidated,
    ).toBe(false);
  });

  /*
  실패하면 서버에서 지워지지 않았으므로 캐시는 그대로 둔다.
  */
  it("삭제에 실패하면 상세와 목록 캐시를 건드리지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const missingDetail = { ...WORKSPACE_DETAIL, id: "999" };
    queryClient.setQueryData(workspaceQueryKeys.detail("999"), missingDetail);
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useDeleteWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "999", folderId: null });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(workspaceQueryKeys.detail("999"))).toEqual(
      missingDetail,
    );
    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
        ?.isInvalidated,
    ).toBe(false);
  });
});
