import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FolderCard } from "./FolderCard";

const FOLDER = {
  id: "3",
  name: "문서",
};

describe("FolderCard", () => {
  it("메뉴에서 삭제하기를 고르면 onDelete를 부른다", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <FolderCard folder={FOLDER} onDelete={onDelete} onRename={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "문서 폴더 메뉴" }));
    await user.click(screen.getByRole("menuitem", { name: "삭제하기" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  /*
  삭제 요청이 진행 중인 동안에는 항목을 남겨 둔 채 막는다. 사라지면 메뉴 모양이 요청 상태에 따라 흔들린다.
  */
  it("isDeleteDisabled면 삭제 항목을 막고 onDelete를 부르지 않는다", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <FolderCard
        folder={FOLDER}
        isDeleteDisabled
        onDelete={onDelete}
        onRename={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "문서 폴더 메뉴" }));
    const deleteItem = screen.getByRole("menuitem", { name: "삭제하기" });
    await user.click(deleteItem);

    expect(deleteItem).toBeDisabled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
