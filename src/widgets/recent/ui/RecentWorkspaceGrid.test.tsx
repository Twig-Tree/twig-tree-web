import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecentWorkspaceGrid } from "./RecentWorkspaceGrid";

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "아직 워크스페이스가 없습니다.";
const LOADING_MESSAGE = "목록을 불러오는 중입니다.";

const renderGrid = (
  overrides: Partial<Parameters<typeof RecentWorkspaceGrid>[0]> = {},
) =>
  render(
    <RecentWorkspaceGrid
      isError={false}
      isLoaded={true}
      isLoading={false}
      workspaces={[]}
      {...overrides}
    />,
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
  it("받은 순서대로 워크스페이스 카드를 그린다", () => {
    renderGrid({ workspaces });

    const cardLinks = screen.getAllByRole("link");

    expect(cardLinks.map((link) => link.getAttribute("aria-label"))).toEqual([
      "최근 수정 워크스페이스 열기",
      "예전 수정 워크스페이스 열기",
    ]);
  });

  /*
  폴더를 가로지르는 목록이라 수정·삭제에 필요한 folderId를 모른다. 동작하지 않는 메뉴를 두지 않는다.
  */
  it("카드에 메뉴를 붙이지 않는다", () => {
    renderGrid({ workspaces });

    expect(
      screen.queryByRole("button", { name: /워크스페이스 메뉴/ }),
    ).not.toBeInTheDocument();
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
