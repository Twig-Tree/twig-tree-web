import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
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

/*
jsdom의 navigator.platform은 빈 문자열이라 Windows 표로 판단한다.
*/
describe("EditorToolbar 실행 취소 단축키", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Windows는 Ctrl 계열 단축키를 툴팁과 aria-keyshortcuts로 알린다", () => {
    render(<EditorToolbar {...baseProps} treeLevel={null} />);

    const undoButton = screen.getByRole("button", { name: "되돌리기" });
    const redoButton = screen.getByRole("button", { name: "다시 실행" });

    expect(undoButton.title).toBe("되돌리기 (Ctrl+Z)");
    expect(undoButton.getAttribute("aria-keyshortcuts")).toBe("Control+Z");
    expect(redoButton.title).toBe("다시 실행 (Ctrl+Shift+Z)");
    expect(redoButton.getAttribute("aria-keyshortcuts")).toBe(
      "Control+Shift+Z Control+Y",
    );
  });

  it("맥은 ⌘ 계열 단축키를 알린다", () => {
    vi.spyOn(Navigator.prototype, "platform", "get").mockReturnValue(
      "MacIntel",
    );
    render(<EditorToolbar {...baseProps} treeLevel={null} />);

    const undoButton = screen.getByRole("button", { name: "되돌리기" });

    expect(undoButton.title).toBe("되돌리기 (⌘Z)");
    expect(undoButton.getAttribute("aria-keyshortcuts")).toBe("Meta+Z");
  });
});
