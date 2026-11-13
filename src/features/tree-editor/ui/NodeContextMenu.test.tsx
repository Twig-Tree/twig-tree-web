import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { type NodeActionId } from "../lib/shortcuts/nodeActionShortcuts";
import { NodeContextMenu } from "./NodeContextMenu";

const NO_BLOCK: Record<NodeActionId, string | null> = {
  openMemo: null,
  addChild: null,
  rename: null,
  delete: null,
};

const renderMenu = (blockReasons: Partial<typeof NO_BLOCK> = {}) => {
  const handlers = {
    onRunAction: vi.fn(),
    onClose: vi.fn(),
    onEscape: vi.fn(),
  };

  render(
    <div>
      <button type="button">캔버스</button>
      <NodeContextMenu
        x={10}
        y={10}
        blockReasons={{ ...NO_BLOCK, ...blockReasons }}
        {...handlers}
      />
    </div>,
  );

  return handlers;
};

describe("NodeContextMenu", () => {
  it("항목을 고르면 메뉴를 닫고 그 동작을 실행한다", async () => {
    const user = userEvent.setup();
    const { onRunAction, onClose } = renderMenu();

    await user.click(screen.getByRole("menuitem", { name: /노드 삭제/ }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRunAction).toHaveBeenCalledWith("delete");
  });

  /*
  jsdom의 navigator.platform은 빈 문자열이라 Windows 표로 판단한다.
  */
  it("노드 아래 버튼과 같은 네 동작을 단축키와 함께 보여 준다", () => {
    renderMenu();

    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual([
      "메모 열기Enter",
      "자식 노드 추가→",
      "이름 편집F2",
      "노드 삭제Delete",
    ]);
    expect(screen.getByRole("menuitem", { name: /노드 삭제/ })).toHaveAttribute(
      "aria-keyshortcuts",
      "Delete Backspace",
    );
  });

  /*
  마우스로 연 뒤 첫 항목에 focus를 두면 focus 표시가 보이지 않아 Tab이 둘째 항목으로 간다.
  */
  it("열리면 메뉴 자체에 focus를 두고 Tab으로 첫 항목에 간다", async () => {
    const user = userEvent.setup();
    renderMenu();

    expect(screen.getByRole("menu")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("menuitem", { name: /메모 열기/ })).toHaveFocus();
  });

  it("메뉴에서 ↓는 첫 항목, ↑는 마지막 항목으로 가고 막힌 항목은 건너뛴다", async () => {
    const user = userEvent.setup();
    renderMenu({
      addChild: "다른 편집을 저장하는 중입니다.",
      delete: "루트 노드는 삭제할 수 없습니다.",
    });

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: /이름 편집/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /메모 열기/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /이름 편집/ })).toHaveFocus();
  });

  it("Escape를 누르면 focus를 돌려주며 닫는다", async () => {
    const user = userEvent.setup();
    const { onEscape, onClose } = renderMenu();

    await user.keyboard("{Escape}");

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Tab으로 focus가 메뉴 밖으로 나가면 닫는다", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu();

    await user.tab({ shift: true });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("메뉴 밖을 누르면 닫고, 메뉴 안을 누르는 것만으로는 닫지 않는다", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu();

    await user.pointer({
      keys: "[MouseLeft>]",
      target: screen.getByRole("menu"),
    });
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "캔버스" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("막힌 항목은 눌러도 실행하지 않는다", async () => {
    const user = userEvent.setup();
    const { onRunAction } = renderMenu({
      delete: "루트 노드는 삭제할 수 없습니다.",
    });
    const deleteItem = screen.getByRole("menuitem", { name: /노드 삭제/ });

    expect(deleteItem).toBeDisabled();

    await user.click(deleteItem);

    expect(onRunAction).not.toHaveBeenCalled();
  });
});
