import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NodeContextMenu } from "./NodeContextMenu";

const renderMenu = ({
  isAddNodeDisabled = false,
  isDeleteNodeDisabled = false,
} = {}) => {
  const handlers = {
    onOpenMemo: vi.fn(),
    onAddNode: vi.fn(),
    onDeleteNode: vi.fn(),
    onClose: vi.fn(),
  };

  render(
    <div>
      <button type="button">캔버스</button>
      <NodeContextMenu
        x={10}
        y={10}
        isAddNodeDisabled={isAddNodeDisabled}
        isDeleteNodeDisabled={isDeleteNodeDisabled}
        {...handlers}
      />
    </div>,
  );

  return handlers;
};

describe("NodeContextMenu", () => {
  it("항목을 고르면 메뉴를 닫고 그 동작을 실행한다", async () => {
    const user = userEvent.setup();
    const { onDeleteNode, onClose } = renderMenu();

    await user.click(screen.getByRole("menuitem", { name: "노드 삭제" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDeleteNode).toHaveBeenCalledTimes(1);
  });

  it("열리면 첫 항목에 focus를 두고 화살표로 사용 가능한 항목만 오간다", async () => {
    const user = userEvent.setup();
    renderMenu({ isAddNodeDisabled: true });

    expect(screen.getByRole("menuitem", { name: "메모 열기" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "노드 삭제" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "메모 열기" })).toHaveFocus();
  });

  it("Escape를 누르면 닫는다", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("메뉴 밖을 누르면 닫고, 메뉴 안을 누르는 것만으로는 닫지 않는다", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu({ isDeleteNodeDisabled: true });

    await user.pointer({
      keys: "[MouseLeft>]",
      target: screen.getByRole("menu"),
    });
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "캔버스" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("비활성 항목은 눌러도 실행하지 않는다", async () => {
    const user = userEvent.setup();
    const { onAddNode } = renderMenu({ isAddNodeDisabled: true });

    await user.click(screen.getByRole("menuitem", { name: "노드 추가" }));

    expect(onAddNode).not.toHaveBeenCalled();
  });
});
