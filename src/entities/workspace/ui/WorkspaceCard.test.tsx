import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { WorkspaceCard } from "./WorkspaceCard";

const WORKSPACE = {
  id: "2",
  name: "리서치",
  updatedAt: "2026-08-31T21:00:00",
};

describe("WorkspaceCard", () => {
  it("카드를 누르면 해당 워크스페이스로 이동하는 링크를 제공한다", () => {
    render(
      <WorkspaceCard
        workspace={{
          id: "2",
          name: "리서치",
          updatedAt: "2026-08-31T21:00:00",
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "리서치 워크스페이스 열기" }),
    ).toHaveAttribute("href", "/workspace/2");
  });

  /*
  편집을 연결하지 않은 화면(대시보드)에 동작하지 않는 메뉴가 생기지 않아야 한다.
  */
  it("넘긴 동작이 없으면 메뉴를 그리지 않는다", () => {
    render(<WorkspaceCard workspace={WORKSPACE} />);

    expect(
      screen.queryByRole("button", { name: "리서치 워크스페이스 메뉴" }),
    ).not.toBeInTheDocument();
  });

  it("메뉴에서 이름 수정하기를 고르면 onRename을 부른다", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<WorkspaceCard workspace={WORKSPACE} onRename={onRename} />);

    await user.click(
      screen.getByRole("button", { name: "리서치 워크스페이스 메뉴" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "이름 수정하기" }));

    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("onDelete만 넘겨도 메뉴를 그린다", async () => {
    const user = userEvent.setup();
    render(<WorkspaceCard workspace={WORKSPACE} onDelete={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "리서치 워크스페이스 메뉴" }),
    );

    expect(
      screen.getByRole("menuitem", { name: "삭제하기" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "이름 수정하기" }),
    ).not.toBeInTheDocument();
  });

  /*
  삭제를 연결하지 않은 화면에 동작하지 않는 삭제 항목이 생기지 않아야 한다.
  */
  it("onRename만 넘기면 삭제 항목을 그리지 않는다", async () => {
    const user = userEvent.setup();
    render(<WorkspaceCard workspace={WORKSPACE} onRename={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "리서치 워크스페이스 메뉴" }),
    );

    expect(
      screen.queryByRole("menuitem", { name: "삭제하기" }),
    ).not.toBeInTheDocument();
  });

  it("메뉴에서 삭제하기를 고르면 onDelete를 부른다", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <WorkspaceCard
        workspace={WORKSPACE}
        onDelete={onDelete}
        onRename={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "리서치 워크스페이스 메뉴" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "삭제하기" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("isDeleteDisabled면 삭제 항목을 막고 onDelete를 부르지 않는다", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <WorkspaceCard
        workspace={WORKSPACE}
        isDeleteDisabled
        onDelete={onDelete}
        onRename={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "리서치 워크스페이스 메뉴" }),
    );
    const deleteItem = screen.getByRole("menuitem", { name: "삭제하기" });
    await user.click(deleteItem);

    expect(deleteItem).toBeDisabled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
