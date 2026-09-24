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
  it("onRename을 넘기지 않으면 메뉴를 그리지 않는다", () => {
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
});
