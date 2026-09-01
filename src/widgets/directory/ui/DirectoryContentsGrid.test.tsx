import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { DirectoryContentsGrid } from "./DirectoryContentsGrid";

const ERROR_MESSAGE = "목록을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "아직 폴더나 워크스페이스가 없습니다.";

const renderGrid = (
  overrides: Partial<Parameters<typeof DirectoryContentsGrid>[0]> = {},
) =>
  render(
    <DirectoryContentsGrid
      editingFolderId={null}
      folderParentId={null}
      folders={[]}
      isError={false}
      isLoaded={true}
      onEditingStart={vi.fn()}
      onEditingEnd={vi.fn()}
      workspaces={[]}
      {...overrides}
    />,
    { wrapper: createQueryWrapper() },
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

  /*
  조회 중이거나 query가 비활성이면 두 목록 모두 빈 배열이지만 비어 있다고 확인된 것이 아니다.
  */
  it("목록이 아직 도착하지 않았으면 빈 상태를 알리지 않는다", () => {
    renderGrid({ isLoaded: false });

    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(ERROR_MESSAGE)).not.toBeInTheDocument();
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
