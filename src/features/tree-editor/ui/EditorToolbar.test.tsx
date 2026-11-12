import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorToolbar } from "./EditorToolbar";

const baseProps = {
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onFitView: vi.fn(),
  isUndoDisabled: false,
  isRedoDisabled: false,
  onCollapseLevel: vi.fn(),
  onExpandLevel: vi.fn(),
  isCollapseLevelDisabled: false,
  isExpandLevelDisabled: false,
};

describe("EditorToolbar 계층 조절", () => {
  it("현재 계층을 보여 주고 버튼으로 접고 펼친다", () => {
    const onCollapseLevel = vi.fn();
    const onExpandLevel = vi.fn();

    render(
      <EditorToolbar
        {...baseProps}
        treeLevel={2}
        onCollapseLevel={onCollapseLevel}
        onExpandLevel={onExpandLevel}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain("2");

    fireEvent.click(screen.getByRole("button", { name: "한 계층 접기" }));
    fireEvent.click(screen.getByRole("button", { name: "한 계층 펼치기" }));

    expect(onCollapseLevel).toHaveBeenCalledOnce();
    expect(onExpandLevel).toHaveBeenCalledOnce();
  });

  it("끝 계층이면 해당 버튼을 막는다", () => {
    render(
      <EditorToolbar {...baseProps} treeLevel={1} isCollapseLevelDisabled />,
    );

    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "한 계층 접기" })
        .disabled,
    ).toBe(true);
  });

  it("계층이 없으면 계층 조절을 그리지 않는다", () => {
    render(<EditorToolbar {...baseProps} treeLevel={null} />);

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("button", { name: "한 계층 접기" })).toBeNull();
  });
});
