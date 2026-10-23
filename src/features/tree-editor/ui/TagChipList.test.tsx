import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TagChipList } from "./TagChipList";

const nodeTags = [
  { id: "t1", name: "React" },
  { id: "t2", name: "중요" },
];

describe("TagChipList", () => {
  it("노드에 붙은 태그를 붙인 순서대로 칩으로 보여 준다", () => {
    render(<TagChipList nodeTags={nodeTags} onDetach={vi.fn()} />);

    const removeButtons = within(
      screen.getByRole("region", { name: "노드 태그" }),
    ).getAllByRole("button");

    expect(
      removeButtons.map((button) => button.getAttribute("aria-label")),
    ).toEqual(["React 태그 제거", "중요 태그 제거"]);
  });

  it("칩의 X 버튼을 누르면 그 태그의 ID만 넘긴다", async () => {
    const user = userEvent.setup();
    const onDetach = vi.fn();
    render(<TagChipList nodeTags={nodeTags} onDetach={onDetach} />);

    await user.click(screen.getByRole("button", { name: "중요 태그 제거" }));

    expect(onDetach).toHaveBeenCalledExactlyOnceWith("t2");
  });
});
