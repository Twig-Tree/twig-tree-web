import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, it, expect, vi } from "vitest";
import { workspaceApi, workspaceQueryKeys } from "@/src/entities/workspace";
import type { WorkspaceDTO } from "@/src/entities/workspace/api/types";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { useUpdateWorkspace } from "./useUpdateWorkspace";

const WORKSPACES_IN_FOLDER: WorkspaceDTO[] = [
  {
    workspaceId: 2,
    name: "Workspace In Folder",
    folderId: 3,
    treeId: null,
    updatedAt: "2026-08-30T09:00:00",
  },
  {
    workspaceId: 5,
    name: "Sibling",
    folderId: 3,
    treeId: null,
    updatedAt: "2026-08-29T09:00:00",
  },
];

/*
형제 목록 조회 응답을 이 테스트의 목록으로 바꾼다. 공용 목 데이터에는 3번 폴더에 워크스페이스가 하나뿐이라
중복 검사를 확인할 형제가 없다.
*/
const mockSiblingWorkspaces = () => {
  server.use(
    http.get("*/api/workspaces", () =>
      HttpResponse.json(
        {
          isSuccess: true,
          code: "WORKSPACES_FOUND",
          message: "워크스페이스 목록이 조회되었습니다.",
          data: WORKSPACES_IN_FOLDER,
        },
        { status: 200 },
      ),
    ),
  );
};

const renderUseUpdateWorkspace = () => {
  const { queryClient, wrapper } = createQueryWrapper();
  const { result } = renderHook(() => useUpdateWorkspace({ folderId: "3" }), {
    wrapper,
  });

  return { queryClient, result };
};

/*
형제 목록이 도착할 때까지 기다린다. 도착 전에는 검증이 막혀 있어 요청 결과를 확인할 수 없다.
*/
const renderLoadedUseUpdateWorkspace = async () => {
  mockSiblingWorkspaces();
  const rendered = renderUseUpdateWorkspace();

  await waitFor(() =>
    expect(rendered.result.current.isUpdateWorkspaceDisabled).toBe(false),
  );

  return rendered;
};

describe("useUpdateWorkspace", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("앞뒤 공백을 자른 이름으로 요청하고 true를 돌려준다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { result } = await renderLoadedUseUpdateWorkspace();

    const isUpdated = await result.current.updateWorkspace({
      workspaceId: "2",
      name: "  새 이름  ",
    });

    expect(isUpdated).toBe(true);
    expect(updateWorkspaceSpy).toHaveBeenCalledWith(2, { name: "새 이름" });
  });

  it("검증에 실패하면 요청하지 않고 false를 돌려준다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { result } = await renderLoadedUseUpdateWorkspace();

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
  it("형제 목록이 도착하기 전에는 요청하지 않고 안내 문구를 돌려준다", async () => {
    const updateWorkspaceSpy = vi.spyOn(workspaceApi, "updateWorkspace");
    const { result } = renderUseUpdateWorkspace();

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

  it("속한 폴더의 형제 목록을 조회한다", async () => {
    const getWorkspaceListSpy = vi.spyOn(workspaceApi, "getWorkspaceList");
    await renderLoadedUseUpdateWorkspace();

    expect(getWorkspaceListSpy).toHaveBeenCalledWith(3);
  });

  it("형제 목록 조회에 실패하면 검증을 통과시키지 않는다", async () => {
    server.use(
      http.get("*/api/workspaces", () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "COMMON500",
            message: "서버 에러",
            data: null,
          },
          { status: 500 },
        ),
      ),
    );
    const { queryClient, result } = renderUseUpdateWorkspace();

    await waitFor(() =>
      expect(
        queryClient.getQueryState(workspaceQueryKeys.listByFolder("3"))?.status,
      ).toBe("error"),
    );

    expect(
      result.current.getWorkspaceNameError({
        workspaceId: "2",
        name: "새 이름",
      }),
    ).toBe("워크스페이스 목록을 불러온 후 다시 시도해 주세요.");
    expect(result.current.isUpdateWorkspaceDisabled).toBe(true);
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
    const { result } = await renderLoadedUseUpdateWorkspace();

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
