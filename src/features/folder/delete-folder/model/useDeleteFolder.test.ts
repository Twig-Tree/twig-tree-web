import { renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useDeleteFolder } from "./useDeleteFolder";

const renderUseDeleteFolder = () => {
  const { queryClient, wrapper } = createQueryWrapper();
  queryClient.setQueryData(workspaceQueryKeys.recent(), []);

  const { result } = renderHook(
    () => useDeleteFolder({ folderParentId: null }),
    { wrapper },
  );

  return {
    isRecentInvalidated: () =>
      queryClient.getQueryState(workspaceQueryKeys.recent())?.isInvalidated,
    result,
  };
};

describe("useDeleteFolder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /*
  폴더를 지우면 안의 워크스페이스도 DB에서 함께 지워지므로 최신순 목록이 낡는다.
  */
  it("삭제에 성공하면 최신순 워크스페이스 목록 캐시를 무효화한다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { isRecentInvalidated, result } = renderUseDeleteFolder();

    const isDeleted = await result.current.deleteFolder({
      folderId: "3",
      name: "Root Folder",
    });

    expect(isDeleted).toBe(true);
    expect(isRecentInvalidated()).toBe(true);
  });

  it("삭제에 실패하면 최신순 목록을 건드리지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { isRecentInvalidated, result } = renderUseDeleteFolder();

    const isDeleted = await result.current.deleteFolder({
      folderId: "999",
      name: "Missing Folder",
    });

    expect(isDeleted).toBe(false);
    expect(isRecentInvalidated()).toBe(false);
  });

  it("확인에서 취소하면 최신순 목록을 건드리지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { isRecentInvalidated, result } = renderUseDeleteFolder();

    const isDeleted = await result.current.deleteFolder({
      folderId: "3",
      name: "Root Folder",
    });

    expect(isDeleted).toBe(false);
    expect(isRecentInvalidated()).toBe(false);
  });
});
