import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import {
  type WorkspaceItem,
  workspaceQueryKeys,
} from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { WorkspaceHeader } from "./WorkspaceHeader";

const WORKSPACE: WorkspaceItem = {
  id: "2",
  name: "Workspace In Folder",
  folderId: "3",
  updatedAt: "2026-08-30T00:00:00.000000Z",
};

const renderHeader = (props: Parameters<typeof WorkspaceHeader>[0]) => {
  const { queryClient, wrapper } = createQueryWrapper();
  render(<WorkspaceHeader {...props} />, { wrapper });

  return { queryClient };
};

/*
편집 입력창은 형제 목록이 도착해야 저장할 수 있다. 도착 전에 저장하면 검증이 막혀 편집 상태가 끝나지 않는다.
*/
const startEditing = async (
  queryClient: ReturnType<typeof renderHeader>["queryClient"],
) => {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: WORKSPACE.name }));

  await waitFor(() =>
    expect(
      queryClient.getQueryData(workspaceQueryKeys.listByFolder("3")),
    ).toBeDefined(),
  );

  return user;
};

describe("WorkspaceHeader", () => {
  it("워크스페이스 이름을 제목으로 보여준다", () => {
    renderHeader({ workspace: WORKSPACE });

    expect(
      screen.getByRole("heading", { name: WORKSPACE.name }),
    ).toBeInTheDocument();
  });

  it("이름을 불러오는 중에는 이름 대신 안내만 읽히고 편집할 수 없다", () => {
    renderHeader({ workspace: undefined, isNameLoading: true });

    expect(
      screen.getByRole("heading", {
        name: "워크스페이스 이름을 불러오는 중입니다.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  /*
  입력창이 형제 목록을 조회하므로, 늘 그려 두면 워크스페이스에 들어올 때마다 목록 요청이 나간다.
  */
  it("제목을 누르기 전에는 형제 목록을 조회하지 않는다", () => {
    const { queryClient } = renderHeader({ workspace: WORKSPACE });

    expect(
      queryClient.getQueryState(workspaceQueryKeys.listByFolder("3")),
    ).toBeUndefined();
  });

  it("제목을 눌러 이름을 저장하면 새 이름을 제목으로 보여준다", async () => {
    const { queryClient } = renderHeader({ workspace: WORKSPACE });
    const user = await startEditing(queryClient);

    const input = screen.getByRole("textbox", { name: "워크스페이스 이름" });
    await user.clear(input);
    await user.type(input, "새 이름{Enter}");

    /*
    헤더는 받은 workspace를 그리므로, 상세 캐시가 응답으로 덮였는지와 편집이 끝났는지를 확인한다.
    새 이름이 제목에 보이는 것은 상세 캐시를 넘기는 페이지가 맡는다.
    */
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "워크스페이스 이름" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      queryClient.getQueryData<WorkspaceItem>(
        workspaceQueryKeys.detail(WORKSPACE.id),
      )?.name,
    ).toBe("새 이름");
  });

  it("Escape로 편집을 끝내면 기존 제목으로 돌아가고 제목 버튼에 focus를 둔다", async () => {
    const { queryClient } = renderHeader({ workspace: WORKSPACE });
    const user = await startEditing(queryClient);

    await user.type(
      screen.getByRole("textbox", { name: "워크스페이스 이름" }),
      "바꾸다 만 이름{Escape}",
    );

    const titleButton = screen.getByRole("button", { name: WORKSPACE.name });
    expect(titleButton).toBeInTheDocument();
    await waitFor(() => expect(titleButton).toHaveFocus());
  });

  /*
  focus를 받지 않는 빈 곳을 눌러도 activeElement는 body가 된다. 이때 제목 버튼으로 focus를 되돌리면
  사용자가 편집을 떠난 곳에서 focus를 빼앗는다.
  */
  it("입력창을 벗어나 편집이 끝나면 제목 버튼으로 focus를 옮기지 않는다", async () => {
    const { queryClient } = renderHeader({ workspace: WORKSPACE });
    const user = await startEditing(queryClient);

    await user.click(document.body);

    const titleButton = await screen.findByRole("button", {
      name: WORKSPACE.name,
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(titleButton).not.toHaveFocus();
  });

  it("편집 중에도 제목은 화면 구조에 남는다", async () => {
    const { queryClient } = renderHeader({ workspace: WORKSPACE });
    await startEditing(queryClient);

    expect(
      screen.getByRole("heading", { name: WORKSPACE.name }),
    ).toBeInTheDocument();
  });

  it("같은 폴더에 같은 이름이 있으면 안내하고 편집 상태를 유지한다", async () => {
    server.use(
      http.get("*/api/workspaces", () =>
        HttpResponse.json(
          {
            isSuccess: true,
            code: "WORKSPACES_FOUND",
            message: "워크스페이스 목록이 조회되었습니다.",
            data: [
              {
                workspaceId: 2,
                name: "Workspace In Folder",
                folderId: 3,
                treeId: null,
                updatedAt: "2026-08-30T00:00:00.000000Z",
              },
              {
                workspaceId: 5,
                name: "Sibling",
                folderId: 3,
                treeId: null,
                updatedAt: "2026-08-29T00:00:00.000000Z",
              },
            ],
          },
          { status: 200 },
        ),
      ),
    );
    const { queryClient } = renderHeader({ workspace: WORKSPACE });
    const user = await startEditing(queryClient);

    const input = screen.getByRole("textbox", { name: "워크스페이스 이름" });
    await user.clear(input);
    await user.type(input, "Sibling{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "같은 위치에 동일한 이름의 워크스페이스가 있습니다.",
    );
    expect(input).toBeInTheDocument();
  });
});
