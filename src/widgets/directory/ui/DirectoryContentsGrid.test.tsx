import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { DirectoryContentsGrid } from "./DirectoryContentsGrid";

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "아직 폴더나 워크스페이스가 없습니다.";
const LOADING_MESSAGE = "목록을 불러오는 중입니다.";

const renderGrid = (
  overrides: Partial<Parameters<typeof DirectoryContentsGrid>[0]> = {},
) =>
  render(
    <DirectoryContentsGrid
      editingFolderId={null}
      editingWorkspaceId={null}
      folderParentId={null}
      folders={[]}
      isError={false}
      isLoaded={true}
      isLoading={false}
      onFolderEditingStart={vi.fn()}
      onEditingEnd={vi.fn()}
      onWorkspaceEditingStart={vi.fn()}
      workspaces={[]}
      {...overrides}
    />,
    { wrapper: createQueryWrapper().wrapper },
  );

const folder = { id: "1", name: "기획 폴더" };
const workspace = {
  id: "2",
  name: "리서치",
  updatedAt: "2026-08-31T21:00:00",
};

describe("DirectoryContentsGrid", () => {
  it("목록이 있으면 폴더와 워크스페이스를 함께 그린다", () => {
    renderGrid({ folders: [folder], workspaces: [workspace] });

    expect(screen.getByText("기획 폴더")).toBeInTheDocument();
    expect(screen.getByText("리서치")).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  /*
  폴더 ID와 워크스페이스 ID는 둘 다 숫자 문자열이라 값이 겹칠 수 있다.
  편집 상태를 따로 받지 않으면 같은 ID의 폴더까지 편집 카드로 바뀐다.
  */
  it("ID가 같은 폴더가 있어도 편집 중인 워크스페이스만 편집 카드로 그린다", () => {
    renderGrid({
      editingWorkspaceId: "2",
      folders: [{ id: "2", name: "기획 폴더" }],
      workspaces: [workspace],
    });

    expect(
      screen.getByRole("textbox", { name: "워크스페이스 이름" }),
    ).toHaveValue("리서치");
    expect(
      screen.queryByRole("textbox", { name: "폴더 이름" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("기획 폴더")).toBeInTheDocument();
  });

  it("두 목록이 모두 비면 빈 상태를 알린다", () => {
    renderGrid();

    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
  });

  /*
  한쪽만 비어 있는 것은 빈 화면이 아니다. 그리드가 둘을 함께 그리기 때문이다.
  */
  it("한쪽만 비면 빈 상태를 알리지 않는다", () => {
    renderGrid({ folders: [folder] });

    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByText("기획 폴더")).toBeInTheDocument();
  });

  it("조회 중이면 자리표시자를 보여준다", () => {
    renderGrid({ isLoaded: false, isLoading: true });

    expect(screen.getByText(LOADING_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  /*
  query가 비활성이면 조회 중도 아니고 도착한 것도 아니다. 이때 자리표시자를 두면
  끝나지 않는 로딩으로 보이고, 빈 상태를 알리면 확인되지 않은 사실을 말하게 된다.
  */
  it("조회를 시작하지 않았으면 아무 상태도 알리지 않는다", () => {
    renderGrid({ isLoaded: false, isLoading: false });

    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument();
  });

  it("조회 중이더라도 실패가 우선한다", () => {
    renderGrid({ isError: true, isLoading: true });

    expect(screen.getByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument();
  });

  it("조회에 실패하면 실패를 알린다", () => {
    renderGrid({ isError: true });

    expect(screen.getByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
  });

  /*
  한쪽만 실패해도 성공한 쪽을 그리지 않는다. 그리면 실패한 쪽이 "비어 있음"으로 읽힌다.
  */
  it("조회에 실패하면 성공한 목록도 그리지 않는다", () => {
    renderGrid({ isError: true, folders: [folder], workspaces: [workspace] });

    expect(screen.queryByText("기획 폴더")).not.toBeInTheDocument();
    expect(screen.queryByText("리서치")).not.toBeInTheDocument();
  });
});
