import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { folderApi } from "../../api/folderApi";
import { folderQueryKeys } from "../queryKeys";
import { useMoveFolderMutation } from "./useMoveFolderMutation";

describe("useMoveFolderMutation", () => {
  /*
  fromParentId는 캐시를 찾는 데만 쓴다. 요청에 실리면 백엔드 계약에 없는 필드가 나간다.
  */
  it("숫자 ID와 옮겨 갈 부모 ID만 담아 요청한다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useMoveFolderMutation(), { wrapper });

    result.current.mutate({
      folderId: "4",
      fromParentId: "3",
      toParentId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(moveFolderSpy).toHaveBeenCalledWith(4, { folderParentId: null });
  });

  it("예전 부모와 새 부모의 하위 폴더 목록 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(folderQueryKeys.childrenByParent("3"), []);
    queryClient.setQueryData(folderQueryKeys.childrenByParent(null), []);

    const { result } = renderHook(() => useMoveFolderMutation(), { wrapper });

    result.current.mutate({
      folderId: "4",
      fromParentId: "3",
      toParentId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(folderQueryKeys.childrenByParent("3"))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(folderQueryKeys.childrenByParent(null))
        ?.isInvalidated,
    ).toBe(true);
  });

  it("이동과 무관한 폴더의 하위 폴더 목록은 무효화하지 않는다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(folderQueryKeys.childrenByParent("99"), []);

    const { result } = renderHook(() => useMoveFolderMutation(), { wrapper });

    result.current.mutate({
      folderId: "4",
      fromParentId: "3",
      toParentId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(folderQueryKeys.childrenByParent("99"))
        ?.isInvalidated,
    ).toBe(false);
  });

  /*
  옮긴 폴더 아래의 하위 폴더도 상위 경로가 바뀌므로, 옮긴 폴더가 아닌 경로 캐시도 무효화돼야 한다.
  */
  it("모든 폴더 경로 캐시를 무효화한다", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(folderQueryKeys.path("4"), []);
    queryClient.setQueryData(folderQueryKeys.path("5"), []);

    const { result } = renderHook(() => useMoveFolderMutation(), { wrapper });

    result.current.mutate({
      folderId: "4",
      fromParentId: "3",
      toParentId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(folderQueryKeys.path("4"))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(folderQueryKeys.path("5"))?.isInvalidated,
    ).toBe(true);
  });
});
