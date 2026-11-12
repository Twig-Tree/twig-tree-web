import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceApi } from "../../api/workspaceApi";
import type { WorkspaceDetail } from "../types";
import { workspaceQueryKeys } from "../queryKeys";
import { useMoveWorkspaceMutation } from "./useMoveWorkspaceMutation";

describe("useMoveWorkspaceMutation", () => {
  /*
  fromFolderId는 캐시를 찾는 데만 쓴다. 요청에 실리면 백엔드 계약에 없는 필드가 나간다.
  */
  it("숫자 ID와 옮겨 갈 폴더 ID만 담아 요청한다", async () => {
    const moveWorkspaceSpy = vi.spyOn(workspaceApi, "moveWorkspace");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useMoveWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      fromFolderId: null,
      toFolderId: "3",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(moveWorkspaceSpy).toHaveBeenCalledWith(1, { folderId: 3 });
  });

  it("상세 캐시를 이동 응답으로 덮는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData<WorkspaceDetail>(workspaceQueryKeys.detail("1"), {
      id: "1",
      name: "Root Workspace",
      folderId: null,
      updatedAt: "2026-08-31T12:00:00.000000Z",
      treeId: "10",
    });

    const { result } = renderHook(() => useMoveWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      fromFolderId: null,
      toFolderId: "3",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(workspaceQueryKeys.detail("1"))).toEqual({
      id: "1",
      name: "Root Workspace",
      folderId: "3",
      updatedAt: "2026-11-13T15:00:00.000000Z",
      treeId: "10",
    });
  });

  it("예전 폴더와 새 폴더의 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("3"), []);

    const { result } = renderHook(() => useMoveWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      fromFolderId: null,
      toFolderId: "3",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder("3"))
        ?.isInvalidated,
    ).toBe(true);
  });

  it("이동과 무관한 폴더의 워크스페이스 목록은 무효화하지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("99"), []);

    const { result } = renderHook(() => useMoveWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      fromFolderId: null,
      toFolderId: "3",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder("99"))
        ?.isInvalidated,
    ).toBe(false);
  });

  /*
  서버가 이동에도 수정 시각을 갱신해 최신순 목록의 순서가 바뀐다.
  */
  it("최신순 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.recent(), []);

    const { result } = renderHook(() => useMoveWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({
      workspaceId: "1",
      fromFolderId: null,
      toFolderId: "3",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
    ).toBe(true);
  });
});
