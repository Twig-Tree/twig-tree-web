import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  WORKSPACE_ERROR_CODE,
  workspaceApi,
  type WorkspaceItem,
} from "@/src/entities/workspace";
import { createNodeApiError } from "@/src/tests/helpers/createNodeApiError";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useToastStore } from "@/src/shared/ui/toast/toastStore";
import { useMoveWorkspaceByDrop } from "./useMoveWorkspaceByDrop";

const WORKSPACE: WorkspaceItem = {
  id: "2",
  name: "Workspace In Folder",
  folderId: "3",
  updatedAt: "2026-08-30T00:00:00.000000Z",
};

const renderUseMoveWorkspaceByDrop = () => {
  const { wrapper } = createQueryWrapper();
  const { result } = renderHook(() => useMoveWorkspaceByDrop(), { wrapper });

  return { result };
};

describe("useMoveWorkspaceByDrop", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("놓은 폴더로 옮기고 토스트를 띄우지 않는다", async () => {
    const moveWorkspaceSpy = vi.spyOn(workspaceApi, "moveWorkspace");
    const { result } = renderUseMoveWorkspaceByDrop();

    await act(async () => {
      await result.current.moveWorkspaceByDrop(WORKSPACE, null);
    });

    expect(moveWorkspaceSpy).toHaveBeenCalledWith(2, { folderId: null });
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("지금 있는 폴더에 놓으면 요청하지 않고 알리지도 않는다", async () => {
    const moveWorkspaceSpy = vi.spyOn(workspaceApi, "moveWorkspace");
    const { result } = renderUseMoveWorkspaceByDrop();

    await act(async () => {
      await result.current.moveWorkspaceByDrop(WORKSPACE, "3");
    });

    expect(moveWorkspaceSpy).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("거절되면 사유에 맞는 문구를 error 토스트로 띄운다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(workspaceApi, "moveWorkspace").mockRejectedValue(
      createNodeApiError(400, WORKSPACE_ERROR_CODE.DUPLICATE_WORKSPACE_NAME),
    );
    const { result } = renderUseMoveWorkspaceByDrop();

    await act(async () => {
      await result.current.moveWorkspaceByDrop(WORKSPACE, null);
    });

    expect(useToastStore.getState().toasts).toMatchObject([
      {
        message: "옮길 위치에 같은 이름의 워크스페이스가 있습니다.",
        tone: "error",
      },
    ]);
  });
});
