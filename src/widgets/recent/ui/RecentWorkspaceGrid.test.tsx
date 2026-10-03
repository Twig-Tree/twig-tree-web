import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import { workspaceApi } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { RecentWorkspaceGrid } from "./RecentWorkspaceGrid";

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "아직 워크스페이스가 없습니다.";
const LOADING_MESSAGE = "목록을 불러오는 중입니다.";

const renderGrid = (
  overrides: Partial<Parameters<typeof RecentWorkspaceGrid>[0]> = {},
) =>
  render(
    <RecentWorkspaceGrid
      editingWorkspaceId={null}
      isError={false}
      isLoaded={true}
      isLoading={false}
      onEditingEnd={vi.fn()}
      onWorkspaceEditingStart={vi.fn()}
      workspaces={[]}
      {...overrides}
    />,
    { wrapper: createQueryWrapper().wrapper },
  );

const workspaces = [
  {
    id: "1",
    name: "최근 수정",
    folderId: null,
    updatedAt: "2026-08-31T21:00:00",
  },
  {
    id: "2",
    name: "예전 수정",
    folderId: "3",
    updatedAt: "2026-08-30T09:00:00",
  },
];

describe("RecentWorkspaceGrid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("받은 순서대로 워크스페이스 카드를 그린다", () => {
    renderGrid({ workspaces });

    const cardLinks = screen.getAllByRole("link");

    expect(cardLinks.map((link) => link.getAttribute("aria-label"))).toEqual([
      "최근 수정 워크스페이스 열기",
      "예전 수정 워크스페이스 열기",
    ]);
  });

  it("메뉴에서 이름 수정하기를 고르면 그 워크스페이스의 편집을 시작한다", async () => {
    const user = userEvent.setup();
    const onWorkspaceEditingStart = vi.fn();
    renderGrid({ onWorkspaceEditingStart, workspaces });

    await user.click(
      screen.getByRole("button", { name: "예전 수정 워크스페이스 메뉴" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "이름 수정하기" }));

    expect(onWorkspaceEditingStart).toHaveBeenCalledWith("2");
  });

  it("편집 중인 워크스페이스만 편집 카드로 그린다", () => {
    renderGrid({ editingWorkspaceId: "2", workspaces });

    expect(
      screen.getByRole("textbox", { name: "워크스페이스 이름" }),
    ).toHaveValue("예전 수정");
    expect(
      screen.getByRole("link", { name: "최근 수정 워크스페이스 열기" }),
    ).toBeInTheDocument();
  });

  /*
  폴더를 가로지르는 목록이라 항목마다 속한 폴더가 다르다. 각 항목의 folderId로 삭제해야
  그 폴더의 목록 캐시가 갱신된다.
  */
  it("서로 다른 폴더의 워크스페이스를 삭제할 수 있다", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const deleteWorkspaceSpy = vi.spyOn(workspaceApi, "deleteWorkspace");
    renderGrid({ workspaces });

    await user.click(
      screen.getByRole("button", { name: "최근 수정 워크스페이스 메뉴" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "삭제하기" }));
    await waitFor(() => expect(deleteWorkspaceSpy).toHaveBeenCalledWith(1));

    await user.click(
      screen.getByRole("button", { name: "예전 수정 워크스페이스 메뉴" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "삭제하기" }));
    await waitFor(() => expect(deleteWorkspaceSpy).toHaveBeenCalledWith(2));
  });

  it("목록이 비면 빈 상태를 알린다", () => {
    renderGrid();

    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it("조회 중이면 자리표시자를 보여준다", () => {
    renderGrid({ isLoaded: false, isLoading: true });

    expect(screen.getByText(LOADING_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  /*
  네트워크가 끊겨 조회가 멈추면 조회 중도 오류도 아니다. 이때 빈 상태를 띄우면 비어 있다고 잘못 알린다.
  */
  it("목록이 도착하기 전에는 빈 상태를 알리지 않는다", () => {
    renderGrid({ isLoaded: false });

    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  /*
  재조회가 실패하면 이전 목록이 남아 있어도 오류를 먼저 알린다.
  */
  it("조회에 실패하면 이전 목록 대신 오류를 알린다", () => {
    renderGrid({ isError: true, workspaces });

    expect(screen.getByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
    expect(screen.queryByText("최근 수정")).not.toBeInTheDocument();
  });
});
