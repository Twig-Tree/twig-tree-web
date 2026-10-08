import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import {
  type WorkspaceItem,
  workspaceQueryKeys,
} from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { EditableWorkspaceCard } from "./EditableWorkspaceCard";

const WORKSPACE: WorkspaceItem = {
  id: "2",
  name: "Workspace In Folder",
  folderId: "3",
  updatedAt: "2026-08-30T00:00:00.000000Z",
};

/*
형제 목록이 도착할 때까지 기다린다. 도착 전에 저장하면 검증이 막혀 편집 상태가 끝나지 않는다.
*/
const renderCard = async (onEditingEnd: () => void) => {
  const { queryClient, wrapper } = createQueryWrapper();
  const rendered = render(
    <EditableWorkspaceCard workspace={WORKSPACE} onEditingEnd={onEditingEnd} />,
    { wrapper },
  );

  await waitFor(() =>
    expect(
      queryClient.getQueryData(workspaceQueryKeys.listByFolder("3")),
    ).toBeDefined(),
  );

  return rendered;
};

const saveName = async (name: string) => {
  const user = userEvent.setup();
  const input = screen.getByRole("textbox", { name: "워크스페이스 이름" });

  await user.clear(input);
  await user.type(input, `${name}{Enter}`);
};

describe("EditableWorkspaceCard", () => {
  it("이름을 저장하면 편집 상태를 끝낸다", async () => {
    const onEditingEnd = vi.fn();
    await renderCard(onEditingEnd);

    await saveName("새 이름");

    await waitFor(() => expect(onEditingEnd).toHaveBeenCalledTimes(1));
  });

  /*
  형제 목록은 카드가 받지 않고 workspace.folderId로 직접 조회한다.
  조회한 목록으로 중복을 검사하는지 확인한다.
  */
  it("속한 폴더에 같은 이름이 있으면 안내하고 편집 상태를 유지한다", async () => {
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
    const onEditingEnd = vi.fn();
    await renderCard(onEditingEnd);

    await saveName("Sibling");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "같은 위치에 동일한 이름의 워크스페이스가 있습니다.",
    );
    expect(onEditingEnd).not.toHaveBeenCalled();
  });

  /*
  요청 중에도 다른 카드의 편집을 시작할 수 있어 이 카드가 사라질 수 있다.
  사라진 카드가 onEditingEnd를 부르면 사용자가 방금 연 편집이 닫힌다.
  */
  it("요청이 끝나기 전에 카드가 사라지면 편집 상태를 끝내지 않는다", async () => {
    server.use(
      http.patch("*/api/workspaces/:workspaceId", async () => {
        await delay(50);

        return HttpResponse.json(
          {
            isSuccess: true,
            code: "WORKSPACE_UPDATED",
            message: "성공적으로 워크스페이스 정보를 수정했습니다.",
            data: {
              workspaceId: 2,
              name: "새 이름",
              folderId: 3,
              treeId: null,
              updatedAt: "2026-09-23T15:00:00.000000Z",
            },
          },
          { status: 200 },
        );
      }),
    );
    const onEditingEnd = vi.fn();
    const { unmount } = await renderCard(onEditingEnd);

    await saveName("새 이름");
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onEditingEnd).not.toHaveBeenCalled();
  });
});
