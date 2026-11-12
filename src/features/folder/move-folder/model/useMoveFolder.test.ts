import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { FOLDER_ERROR_CODE, folderApi } from "@/src/entities/folder";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useMoveFolder } from "./useMoveFolder";

const FOLDER = { id: "4", name: "Folder In Folder" };

const renderUseMoveFolder = () => {
  const { wrapper } = createQueryWrapper();
  const { result } = renderHook(() => useMoveFolder({ folderParentId: "3" }), {
    wrapper,
  });

  act(() => result.current.openMoveFolder(FOLDER));

  return { result };
};

describe("useMoveFolder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("고른 위치로 옮기고 true를 돌려준다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { result } = renderUseMoveFolder();

    let isMoved = false;
    await act(async () => {
      isMoved = await result.current.moveFolder(null);
    });

    expect(isMoved).toBe(true);
    expect(moveFolderSpy).toHaveBeenCalledWith(4, { folderParentId: null });
    expect(result.current.moveFolderErrorMessage).toBeNull();
  });

  it("지금 위치로는 요청하지 않는다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { result } = renderUseMoveFolder();

    await act(async () => {
      await result.current.moveFolder("3");
    });

    expect(moveFolderSpy).not.toHaveBeenCalled();
  });

  it("자기 자신으로는 요청하지 않고 안내한다", async () => {
    const moveFolderSpy = vi.spyOn(folderApi, "moveFolder");
    const { result } = renderUseMoveFolder();

    let isMoved = true;
    await act(async () => {
      isMoved = await result.current.moveFolder("4");
    });

    expect(isMoved).toBe(false);
    expect(moveFolderSpy).not.toHaveBeenCalled();
    expect(result.current.moveFolderErrorMessage).toBe(
      "폴더를 자기 자신이나 하위 폴더로 옮길 수 없습니다.",
    );
  });

  it.each([
    [
      FOLDER_ERROR_CODE.DUPLICATE_FOLDER_NAME,
      "옮길 위치에 같은 이름의 폴더가 있습니다.",
    ],
    [
      FOLDER_ERROR_CODE.INVALID_MOVE_TARGET,
      "폴더를 자기 자신이나 하위 폴더로 옮길 수 없습니다.",
    ],
    ["COMMON500-1", "폴더를 옮기지 못했습니다. 다시 시도해 주세요."],
  ])("%s로 거절되면 사유에 맞는 안내를 남긴다", async (code, message) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(folderApi, "moveFolder").mockRejectedValue(
      createNodeApiError(400, code),
    );
    const { result } = renderUseMoveFolder();

    let isMoved = true;
    await act(async () => {
      isMoved = await result.current.moveFolder(null);
    });

    expect(isMoved).toBe(false);
    expect(result.current.moveFolderErrorMessage).toBe(message);
  });

  it("다시 열면 이전 실패 안내를 지운다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(folderApi, "moveFolder").mockRejectedValue(
      createNodeApiError(400, FOLDER_ERROR_CODE.DUPLICATE_FOLDER_NAME),
    );
    const { result } = renderUseMoveFolder();

    await act(async () => {
      await result.current.moveFolder(null);
    });
    act(() => result.current.closeMoveFolder());
    act(() => result.current.openMoveFolder(FOLDER));

    expect(result.current.moveFolderErrorMessage).toBeNull();
  });

  /*
  마지막 항목을 옮기면 화면이 팝업째 빈 상태 안내로 바뀌어 닫기 callback이 불리지 않는다.
  hook이 직접 비우지 않으면 목록이 다시 그려질 때 옮긴 폴더의 팝업이 다시 열린다.
  */
  it("옮기고 나면 옮길 폴더를 비운다", async () => {
    const { result } = renderUseMoveFolder();

    await act(async () => {
      await result.current.moveFolder(null);
    });

    expect(result.current.movingFolder).toBeNull();
  });

  it("실패하면 옮길 폴더를 남겨 다시 고를 수 있게 한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(folderApi, "moveFolder").mockRejectedValue(
      createNodeApiError(400, FOLDER_ERROR_CODE.DUPLICATE_FOLDER_NAME),
    );
    const { result } = renderUseMoveFolder();

    await act(async () => {
      await result.current.moveFolder(null);
    });

    expect(result.current.movingFolder).toEqual(FOLDER);
  });
});
