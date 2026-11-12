import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { FOLDER_ERROR_CODE, folderApi } from "@/src/entities/folder";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useToastStore } from "@/src/shared/ui/toast/toastStore";
import { useMoveFolderByDrop } from "./useMoveFolderByDrop";

const FOLDER = { id: "4", name: "Folder In Folder" };

const renderUseMoveFolderByDrop = () => {
  const { wrapper } = createQueryWrapper();
  const { result } = renderHook(
    () => useMoveFolderByDrop({ folderParentId: "3" }),
    { wrapper },
  );

  return { result };
};

describe("useMoveFolderByDrop", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("놓은 위치로 옮기고 토스트를 띄우지 않는다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { result } = renderUseMoveFolderByDrop();

    await act(async () => {
      await result.current.moveFolderByDrop(FOLDER, null);
    });

    expect(moveFolderSpy).toHaveBeenCalledWith(4, { folderParentId: null });
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  /*
  지금 위치에 다시 놓는 것은 끌다 마음을 바꾼 것이지 실패가 아니다.
  */
  it("지금 위치에 놓으면 요청하지 않고 알리지도 않는다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { result } = renderUseMoveFolderByDrop();

    await act(async () => {
      await result.current.moveFolderByDrop(FOLDER, "3");
    });

    expect(moveFolderSpy).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("자기 자신에 놓으면 요청하지 않고 토스트로 알린다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { result } = renderUseMoveFolderByDrop();

    await act(async () => {
      await result.current.moveFolderByDrop(FOLDER, "4");
    });

    expect(moveFolderSpy).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toMatchObject([
      {
        message: "폴더를 자기 자신이나 하위 폴더로 옮길 수 없습니다.",
        tone: "error",
      },
    ]);
  });

  it("거절되면 사유에 맞는 문구를 error 토스트로 띄운다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(folderApi, "moveFolder").mockRejectedValue(
      createNodeApiError(400, FOLDER_ERROR_CODE.DUPLICATE_FOLDER_NAME),
    );
    const { result } = renderUseMoveFolderByDrop();

    await act(async () => {
      await result.current.moveFolderByDrop(FOLDER, null);
    });

    expect(useToastStore.getState().toasts).toMatchObject([
      { message: "옮길 위치에 같은 이름의 폴더가 있습니다.", tone: "error" },
    ]);
  });
});
