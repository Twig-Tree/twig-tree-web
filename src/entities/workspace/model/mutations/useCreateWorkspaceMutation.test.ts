import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { workspaceApi } from "../../api/workspaceApi";
import { workspaceQueryKeys } from "../queryKeys";
import { useCreateWorkspaceMutation } from "./useCreateWorkspaceMutation";

describe("useCreateWorkspaceMutation", () => {
  it("생성 응답을 도메인 모델로 바꿔 돌려준다", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ name: "Workspace", folderId: null });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: "999",
      name: "Workspace",
      updatedAt: "2026-09-07T00:00:00",
    });
  });

  /*
  Number(null)이 0이므로 null 확인이 숫자 변환보다 먼저여야 한다.
  순서가 뒤집히면 루트 생성이 folderId=0으로 나가 이 검사가 실패한다.
  */
  it("루트에 만들 때는 folderId 없이 요청한다", async () => {
    const createWorkspaceSpy = vi.spyOn(workspaceApi, "createWorkspace");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ name: "Workspace", folderId: null });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createWorkspaceSpy).toHaveBeenCalledWith({
      name: "Workspace",
      folderId: null,
    });
  });

  it("생성한 위치의 워크스페이스 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder("3"), []);

    const { result } = renderHook(() => useCreateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ name: "Workspace", folderId: "3" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.listByFolder("3"))
          ?.isInvalidated,
      ).toBe(true),
    );
  });

  /*
  생성한 위치가 아닌 다른 폴더의 목록은 이 워크스페이스와 무관하므로 건드리지 않는다.
  */
  it("다른 위치의 워크스페이스 목록은 무효화하지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(workspaceQueryKeys.listByFolder(null), []);

    const { result } = renderHook(() => useCreateWorkspaceMutation(), {
      wrapper,
    });

    result.current.mutate({ name: "Workspace", folderId: "3" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder(null))
        ?.isInvalidated,
    ).toBe(false);
  });
});
