import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceApi } from "../../api/workspaceApi";
import type { WorkspaceDetail } from "../types";
import { workspaceQueryKeys } from "../queryKeys";
import { useUpdateWorkspaceMutation } from "./useUpdateWorkspaceMutation";

describe("useUpdateWorkspaceMutation", () => {
  it("수정 응답을 treeId까지 담은 도메인 모델로 바꿔 돌려준다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      folderId: null,
      name: "새 이름",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: "1",
      name: "새 이름",
      updatedAt: "2026-09-22T00:00:00",
      treeId: "10",
    });
  });

  /*
  folderId는 캐시를 찾는 데만 쓴다. 요청에 실리면 백엔드 계약에 없는 필드가 나간다.
  */
  it("숫자 ID와 이름만 담아 요청한다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "2", folderId: "3", name: "새 이름" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateWorkspaceSpy).toHaveBeenCalledWith(2, { name: "새 이름" });
  });

  it("상세 캐시를 수정 응답으로 덮는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData<WorkspaceDetail>(workspaceQueryKeys.detail("1"), {
      id: "1",
      name: "Root Workspace",
      updatedAt: "2026-08-31T21:00:00",
      treeId: "10",
    });

    const { result } = renderHook(() => useUpdateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      folderId: null,
      name: "새 이름",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(workspaceQueryKeys.detail("1"))).toEqual({
      id: "1",
      name: "새 이름",
      updatedAt: "2026-09-22T00:00:00",
      treeId: "10",
    });
  });

  it("속한 폴더의 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("3"), []);

    const { result } = renderHook(() => useUpdateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "2", folderId: "3", name: "새 이름" });

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

    const { result } = renderHook(() => useUpdateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ workspaceId: "2", folderId: "3", name: "새 이름" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
        ?.isInvalidated,
    ).toBe(false);
  });
});
