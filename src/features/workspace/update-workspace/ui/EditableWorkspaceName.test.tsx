import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import {
  type WorkspaceItem,
  workspaceQueryKeys,
} from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { EditableWorkspaceName } from "./EditableWorkspaceName";

const WORKSPACE: WorkspaceItem = {
  id: "2",
  name: "Workspace In Folder",
  folderId: "3",
  updatedAt: "2026-08-30T00:00:00.000000Z",
};

/*
수정 요청에 실린 이름을 모은다. 요청이 나갔는지와 앞뒤 공백을 잘랐는지를 함께 확인한다.
*/
const recordUpdateRequests = () => {
  const requestedNames: string[] = [];

  server.use(
    http.patch("*/api/workspaces/:workspaceId", async ({ request }) => {
      const body = (await request.json()) as { name: string };
      requestedNames.push(body.name);

      return HttpResponse.json(
        {
          isSuccess: true,
          code: "WORKSPACE_UPDATED",
          message: "성공적으로 워크스페이스 정보를 수정했습니다.",
          data: {
            workspaceId: 2,
            name: body.name,
            folderId: 3,
            treeId: null,
            updatedAt: "2026-09-23T15:00:00.000000Z",
          },
        },
        { status: 200 },
      );
    }),
  );

  return requestedNames;
};

/*
형제 목록이 도착할 때까지 기다린다. 도착 전에 저장하면 검증이 막혀 편집 상태가 끝나지 않는다.
*/
const renderName = async (onEditingEnd: () => void) => {
  const { queryClient, wrapper } = createQueryWrapper();
  render(
    <EditableWorkspaceName workspace={WORKSPACE} onEditingEnd={onEditingEnd} />,
    { wrapper },
  );

  await waitFor(() =>
    expect(
      queryClient.getQueryData(workspaceQueryKeys.listByFolder("3")),
    ).toBeDefined(),
  );

  return { queryClient };
};

const getInput = () =>
  screen.getByRole("textbox", { name: "워크스페이스 이름" });

describe("EditableWorkspaceName", () => {
  it("편집을 시작하면 기존 이름 전체를 선택한다", async () => {
    await renderName(vi.fn());

    const input = getInput() as HTMLInputElement;

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(WORKSPACE.name.length);
  });

  it("Enter를 누르면 앞뒤 공백을 자른 이름으로 저장하고 편집 상태를 끝낸다", async () => {
    const requestedNames = recordUpdateRequests();
    const onEditingEnd = vi.fn();
    const { queryClient } = await renderName(onEditingEnd);
    const user = userEvent.setup();

    await user.clear(getInput());
    await user.type(getInput(), "  새 이름  {Enter}");

    await waitFor(() => expect(onEditingEnd).toHaveBeenCalledTimes(1));
    expect(requestedNames).toEqual(["새 이름"]);

    /*
    헤더는 상세 캐시의 이름을 그리므로, 편집이 끝나면 새 이름이 바로 보여야 한다.
    */
    expect(
      queryClient.getQueryData<WorkspaceItem>(
        workspaceQueryKeys.detail(WORKSPACE.id),
      )?.name,
    ).toBe("새 이름");
  });

  it("입력창을 벗어나면 저장한다", async () => {
    const requestedNames = recordUpdateRequests();
    const onEditingEnd = vi.fn();
    await renderName(onEditingEnd);
    const user = userEvent.setup();

    await user.clear(getInput());
    await user.type(getInput(), "벗어나서 저장");
    await user.tab();

    await waitFor(() => expect(onEditingEnd).toHaveBeenCalledTimes(1));
    expect(requestedNames).toEqual(["벗어나서 저장"]);
  });

  it("Escape를 누르면 요청 없이 편집 상태를 끝낸다", async () => {
    const requestedNames = recordUpdateRequests();
    const onEditingEnd = vi.fn();
    await renderName(onEditingEnd);
    const user = userEvent.setup();

    await user.clear(getInput());
    await user.type(getInput(), "취소할 이름{Escape}");

    expect(onEditingEnd).toHaveBeenCalledTimes(1);
    expect(requestedNames).toEqual([]);
  });

  it("이름이 그대로면 요청 없이 편집 상태를 끝낸다", async () => {
    const requestedNames = recordUpdateRequests();
    const onEditingEnd = vi.fn();
    await renderName(onEditingEnd);
    const user = userEvent.setup();

    await user.type(getInput(), "{Enter}");

    expect(onEditingEnd).toHaveBeenCalledTimes(1);
    expect(requestedNames).toEqual([]);
  });

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
    const requestedNames = recordUpdateRequests();
    const onEditingEnd = vi.fn();
    await renderName(onEditingEnd);
    const user = userEvent.setup();

    await user.clear(getInput());
    await user.type(getInput(), "Sibling{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "같은 위치에 동일한 이름의 워크스페이스가 있습니다.",
    );
    expect(getInput()).toHaveAttribute("aria-invalid", "true");
    expect(onEditingEnd).not.toHaveBeenCalled();
    expect(requestedNames).toEqual([]);
  });
});
