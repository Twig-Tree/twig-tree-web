import { renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { requestConfirm } from "@/src/shared/ui/confirm-dialog";
import { useDeleteFolder } from "./useDeleteFolder";

vi.mock("@/src/shared/ui/confirm-dialog", () => ({ requestConfirm: vi.fn() }));

const requestConfirmMock = vi.mocked(requestConfirm);

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
    requestConfirmMock.mockReset();
  });

  /*
  폴더를 지우면 안의 워크스페이스도 DB에서 함께 지워지므로 최신순 목록이 낡는다.
  */
  it("삭제에 성공하면 최신순 워크스페이스 목록 캐시를 무효화한다", async () => {
    requestConfirmMock.mockResolvedValue(true);
    const { isRecentInvalidated, result } = renderUseDeleteFolder();

    const isDeleted = await result.current.deleteFolder({
      folderId: "3",
      name: "Root Folder",
    });

    expect(isDeleted).toBe(true);
    expect(isRecentInvalidated()).toBe(true);
  });

  it("삭제에 실패하면 최신순 목록을 건드리지 않는다", async () => {
    requestConfirmMock.mockResolvedValue(true);
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

  /*
  하위 폴더와 워크스페이스·트리·노드까지 함께 사라지는 작업이라, 이름만 묻지 않고 되돌릴 수 없다는 사실까지 알린다.
  */
  it("이름과 함께 삭제되는 대상을 담아 확인받는다", async () => {
    requestConfirmMock.mockResolvedValue(false);
    const { result } = renderUseDeleteFolder();

    await result.current.deleteFolder({ folderId: "3", name: "Root Folder" });

    expect(requestConfirmMock).toHaveBeenCalledWith({
      title: '"Root Folder" 폴더를 삭제할까요?',
      description:
        "폴더 안의 하위 폴더와 워크스페이스, 그 안의 트리와 노드도 모두 함께 삭제되며 되돌릴 수 없습니다.",
      confirmLabel: "삭제",
      tone: "danger",
    });
  });

  it("확인에서 취소하면 최신순 목록을 건드리지 않는다", async () => {
    requestConfirmMock.mockResolvedValue(false);
    const { isRecentInvalidated, result } = renderUseDeleteFolder();

    const isDeleted = await result.current.deleteFolder({
      folderId: "3",
      name: "Root Folder",
    });

    expect(isDeleted).toBe(false);
    expect(isRecentInvalidated()).toBe(false);
  });
});
