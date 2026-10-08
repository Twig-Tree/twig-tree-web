import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecentWorkspaceSection } from "./RecentWorkspaceSection";

const ERROR_MESSAGE = "최근 워크스페이스를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "아직 작업한 워크스페이스가 없습니다.";
const LOADING_MESSAGE = "목록을 불러오는 중입니다.";

const renderSection = (
  overrides: Partial<Parameters<typeof RecentWorkspaceSection>[0]> = {},
) =>
  render(
    <RecentWorkspaceSection
      isError={false}
      isLoaded={true}
      isLoading={false}
      viewAllHref="/recent"
      workspaces={[]}
      {...overrides}
    />,
  );

const workspace = {
  id: "1",
  name: "최근 수정",
  folderId: null,
  updatedAt: "2026-08-31T12:00:00.000000Z",
};

describe("RecentWorkspaceSection", () => {
  it("받은 워크스페이스를 섹션 제목 아래 카드로 그린다", () => {
    renderSection({ workspaces: [workspace] });

    expect(
      screen.getByRole("heading", { level: 3, name: "최근 수정" }),
    ).toBeInTheDocument();
  });

  it("목록이 비면 빈 상태를 알린다", () => {
    renderSection();

    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it("조회 중이면 자리표시자를 보여준다", () => {
    renderSection({ isLoaded: false, isLoading: true });

    expect(screen.getByText(LOADING_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  /*
  네트워크가 끊겨 조회가 멈추면 조회 중도 오류도 아니다. 이때 빈 상태를 띄우면 비어 있다고 잘못 알린다.
  */
  it("목록이 도착하기 전에는 빈 상태를 알리지 않는다", () => {
    renderSection({ isLoaded: false });

    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it("조회에 실패하면 이전 목록 대신 오류를 알린다", () => {
    renderSection({ isError: true, workspaces: [workspace] });

    expect(screen.getByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
    expect(screen.queryByText("최근 수정")).not.toBeInTheDocument();
  });

  /*
  조회에 실패해도 최신순 화면으로 가는 길은 남긴다.
  */
  it("조회에 실패해도 전체 보기 링크를 남긴다", () => {
    renderSection({ isError: true });

    expect(screen.getByRole("link", { name: "View All" })).toHaveAttribute(
      "href",
      "/recent",
    );
  });
});
