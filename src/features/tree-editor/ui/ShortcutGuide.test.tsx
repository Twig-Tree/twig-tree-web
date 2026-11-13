import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShortcutGuide } from "./ShortcutGuide";

/*
안내 밖에서 focus를 갖고 있던 요소. 닫힌 뒤 focus를 돌려받는지 확인한다.
*/
const renderWithPreviousFocus = () => {
  const previous = document.createElement("button");
  document.body.append(previous);
  previous.focus();

  const onClose = vi.fn();
  const view = render(<ShortcutGuide onClose={onClose} />);

  return { previous, onClose, ...view };
};

describe("ShortcutGuide", () => {
  it("열리면 닫기 버튼에 focus를 두고, Escape로 닫기를 요청한다", () => {
    const { onClose } = renderWithPreviousFocus();
    const closeButton = screen.getByRole("button", {
      name: "단축키 안내 닫기",
    });

    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("안내 안에 focus가 있던 채로 닫히면 열기 전 자리로 focus를 돌려준다", () => {
    const { previous, unmount } = renderWithPreviousFocus();

    unmount();

    expect(previous).toHaveFocus();
  });

  /*
  안내를 연 채 노드를 누르고 ?로 닫으면 focus가 노드에 있다. 돌려주면 방금 고른 노드에서 focus를 빼앗는다.
  */
  it("focus가 안내 밖으로 나간 뒤 닫히면 focus를 옮기지 않는다", () => {
    const { previous, unmount } = renderWithPreviousFocus();
    const node = document.createElement("button");
    document.body.append(node);

    node.focus();
    unmount();

    expect(node).toHaveFocus();
    expect(previous).not.toHaveFocus();
  });
});
