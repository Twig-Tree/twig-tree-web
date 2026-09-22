import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, it, expect, vi } from "vitest";
import { type WorkspaceItem, workspaceApi } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { useUpdateWorkspace } from "./useUpdateWorkspace";

const WORKSPACES_IN_FOLDER: WorkspaceItem[] = [
  { id: "2", name: "Workspace In Folder", updatedAt: "2026-08-30T09:00:00" },
  { id: "5", name: "Sibling", updatedAt: "2026-08-29T09:00:00" },
];

const renderUseUpdateWorkspace = (workspaces: WorkspaceItem[] | undefined) => {
  const { wrapper } = createQueryWrapper();
  return renderHook(() => useUpdateWorkspace({ folderId: "3", workspaces }), {
    wrapper,
  });
};

describe("useUpdateWorkspace", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("앞뒤 공백을 자른 이름으로 요청하고 true를 돌려준다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { result } = renderUseUpdateWorkspace(WORKSPACES_IN_FOLDER);

    const isUpdated = await result.current.updateWorkspace({
      workspaceId: "2",
      name: "  새 이름  ",
    });

    expect(isUpdated).toBe(true);
    expect(updateWorkspaceSpy).toHaveBeenCalledWith(2, { name: "새 이름" });
  });

  it("검증에 실패하면 요청하지 않고 false를 돌려준다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { result } = renderUseUpdateWorkspace(WORKSPACES_IN_FOLDER);

    const isUpdated = await result.current.updateWorkspace({
      workspaceId: "2",
      name: "Sibling",
    });

    expect(isUpdated).toBe(false);
    expect(updateWorkspaceSpy).not.toHaveBeenCalled();
  });

  /*
  형제 목록을 모르면 중복 여부를 판단할 수 없다. 추측해서 보내면 서버가 400으로 거절할 수 있다.
  */
  it("형제 목록을 모르면 요청하지 않고 안내 문구를 돌려준다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { result } = renderUseUpdateWorkspace(undefined);

    expect(
      result.current.getWorkspaceNameError({
        workspaceId: "2",
        name: "새 이름",
      }),
    ).toBe("워크스페이스 목록을 불러온 후 다시 시도해 주세요.");
    expect(result.current.isUpdateWorkspaceDisabled).toBe(true);

    const isUpdated = await result.current.updateWorkspace({
      workspaceId: "2",
      name: "새 이름",
    });

    expect(isUpdated).toBe(false);
    expect(updateWorkspaceSpy).not.toHaveBeenCalled();
  });

  it("요청이 실패하면 알리고 false를 돌려준다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.patch("*/api/workspaces/:workspaceId", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "WORKSPACE400-1",
            message:
              "같은 레벨에서 동일한 이름의 워크스페이스는 만들 수 없습니다.",
            data: null,
          },
          { status: 400 },
        ),
      ),
    );
    const { result } = renderUseUpdateWorkspace(WORKSPACES_IN_FOLDER);

    const isUpdated = await result.current.updateWorkspace({
      workspaceId: "2",
      name: "새 이름",
    });

    expect(isUpdated).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(
      "워크스페이스 이름을 수정하지 못했습니다. 다시 시도해 주세요.",
    );
  });
});
