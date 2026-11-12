import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { FOLDER_ERROR_CODE } from "@/src/entities/folder";
import {
  WORKSPACE_ERROR_CODE,
  workspaceApi,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useMoveWorkspace } from "./useMoveWorkspace";

const WORKSPACE: WorkspaceItem = {
  id: "2",
  name: "Workspace In Folder",
  folderId: "3",
  updatedAt: "2026-08-30T00:00:00.000000Z",
};

const renderUseMoveWorkspace = () => {
  const { wrapper } = createQueryWrapper();
  const { result } = renderHook(() => useMoveWorkspace(), { wrapper });

  act(() => result.current.openMoveWorkspace(WORKSPACE));

  return { result };
};

describe("useMoveWorkspace", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("고른 폴더로 옮기고 true를 돌려준다", async () => {
    const moveWorkspaceSpy = vi.spyOn(workspaceApi, "moveWorkspace");
    const { result } = renderUseMoveWorkspace();

    let isMoved = false;
    await act(async () => {
      isMoved = await result.current.moveWorkspace(null);
    });

    expect(isMoved).toBe(true);
    expect(moveWorkspaceSpy).toHaveBeenCalledWith(2, { folderId: null });
  });

  /*
  지금 위치는 hook 인자가 아니라 워크스페이스의 folderId로 판단한다.
  */
  it("워크스페이스가 지금 있는 폴더로는 요청하지 않는다", async () => {
    const moveWorkspaceSpy = vi.spyOn(workspaceApi, "moveWorkspace");
    const { result } = renderUseMoveWorkspace();

    await act(async () => {
      await result.current.moveWorkspace("3");
    });

    expect(moveWorkspaceSpy).not.toHaveBeenCalled();
  });

  it.each([
    [
      WORKSPACE_ERROR_CODE.DUPLICATE_WORKSPACE_NAME,
      "옮길 위치에 같은 이름의 워크스페이스가 있습니다.",
    ],
    [
      FOLDER_ERROR_CODE.FOLDER_NOT_FOUND,
      "옮길 위치를 찾을 수 없습니다. 목록을 새로 고친 뒤 다시 골라 주세요.",
    ],
    ["COMMON500-1", "워크스페이스를 옮기지 못했습니다. 다시 시도해 주세요."],
  ])("%s로 거절되면 사유에 맞는 안내를 남긴다", async (code, message) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(workspaceApi, "moveWorkspace").mockRejectedValue(
      createNodeApiError(400, code),
    );
    const { result } = renderUseMoveWorkspace();

    let isMoved = true;
    await act(async () => {
      isMoved = await result.current.moveWorkspace(null);
    });

    expect(isMoved).toBe(false);
    expect(result.current.moveWorkspaceErrorMessage).toBe(message);
  });

  /*
  마지막 항목을 옮기면 화면이 팝업째 빈 상태 안내로 바뀌어 닫기 callback이 불리지 않는다.
  hook이 직접 비우지 않으면 목록이 다시 그려질 때 옮긴 워크스페이스의 팝업이 다시 열린다.
  */
  it("옮기고 나면 옮길 워크스페이스를 비운다", async () => {
    const { result } = renderUseMoveWorkspace();

    await act(async () => {
      await result.current.moveWorkspace(null);
    });

    expect(result.current.movingWorkspace).toBeNull();
  });
});
