import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import type { WorkspaceItem } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import { EditableWorkspaceCard } from "./EditableWorkspaceCard";

const WORKSPACE: WorkspaceItem = {
  id: "2",
  name: "Workspace In Folder",
  updatedAt: "2026-08-30T09:00:00",
};

const renderCard = (onEditingEnd: () => void) =>
  render(
    <EditableWorkspaceCard
      workspace={WORKSPACE}
      workspaces={[WORKSPACE]}
      folderId="3"
      onEditingEnd={onEditingEnd}
    />,
    { wrapper: createQueryWrapper().wrapper },
  );

const saveName = async (name: string) => {
  const user = userEvent.setup();
  const input = screen.getByRole("textbox", { name: "워크스페이스 이름" });

  await user.clear(input);
  await user.type(input, `${name}{Enter}`);
};

describe("EditableWorkspaceCard", () => {
  it("이름을 저장하면 편집 상태를 끝낸다", async () => {
    const onEditingEnd = vi.fn();
    renderCard(onEditingEnd);

    await saveName("새 이름");

    await waitFor(() => expect(onEditingEnd).toHaveBeenCalledTimes(1));
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
              updatedAt: "2026-09-24T00:00:00",
            },
          },
          { status: 200 },
        );
      }),
    );
    const onEditingEnd = vi.fn();
    const { unmount } = renderCard(onEditingEnd);

    await saveName("새 이름");
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onEditingEnd).not.toHaveBeenCalled();
  });
});
