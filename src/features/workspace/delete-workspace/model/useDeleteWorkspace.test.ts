import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, it, expect, vi } from "vitest";
import { workspaceApi } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { useDeleteWorkspace } from "./useDeleteWorkspace";

const renderUseDeleteWorkspace = (folderId: string | null = "3") => {
  const { wrapper } = createQueryWrapper();
  return renderHook(() => useDeleteWorkspace({ folderId }), { wrapper });
};

describe("useDeleteWorkspace", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /*
  트리까지 함께 사라지는 작업이라, 이름만 묻지 않고 되돌릴 수 없다는 사실까지 알린다.
  */
  it("이름과 트리 삭제 안내를 담아 확인받는다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderUseDeleteWorkspace();

    await result.current.deleteWorkspace({
      workspaceId: "2",
      name: "Workspace In Folder",
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      '"Workspace In Folder" 워크스페이스를 삭제하시겠습니까?\n워크스페이스 안의 트리와 노드도 함께 삭제되며 되돌릴 수 없습니다.',
    );
  });

  it("확인에서 취소하면 요청하지 않고 false를 돌려준다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const deleteWorkspaceSpy = vi.spyOn(workspaceApi, "deleteWorkspace");
    const { result } = renderUseDeleteWorkspace();

    const isDeleted = await result.current.deleteWorkspace({
      workspaceId: "2",
      name: "Workspace In Folder",
    });

    expect(isDeleted).toBe(false);
    expect(deleteWorkspaceSpy).not.toHaveBeenCalled();
  });

  it("확인하면 숫자 ID로 요청하고 true를 돌려준다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const deleteWorkspaceSpy = vi.spyOn(workspaceApi, "deleteWorkspace");
    const { result } = renderUseDeleteWorkspace();

    const isDeleted = await result.current.deleteWorkspace({
      workspaceId: "2",
      name: "Workspace In Folder",
    });

    expect(isDeleted).toBe(true);
    expect(deleteWorkspaceSpy).toHaveBeenCalledWith(2);
  });

  it("속한 폴더 ID가 유효하지 않으면 확인 없이 false를 돌려준다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const deleteWorkspaceSpy = vi.spyOn(workspaceApi, "deleteWorkspace");
    const { result } = renderUseDeleteWorkspace("abc");

    const isDeleted = await result.current.deleteWorkspace({
      workspaceId: "2",
      name: "Workspace In Folder",
    });

    expect(isDeleted).toBe(false);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(deleteWorkspaceSpy).not.toHaveBeenCalled();
  });

  it("요청이 실패하면 알리고 false를 돌려준다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.delete("*/api/workspaces/:workspaceId", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "WORKSPACE403-1",
            message: "해당 워크스페이스에 접근할 권한이 없습니다.",
            data: null,
          },
          { status: 403 },
        ),
      ),
    );
    const { result } = renderUseDeleteWorkspace();

    const isDeleted = await result.current.deleteWorkspace({
      workspaceId: "2",
      name: "Workspace In Folder",
    });

    expect(isDeleted).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(
      "워크스페이스를 삭제하지 못했습니다. 다시 시도해 주세요.",
    );
  });
});
