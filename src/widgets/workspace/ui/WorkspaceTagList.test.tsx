import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { WorkspaceTagList } from "./WorkspaceTagList";

const tags = [
  { id: "t1", name: "React" },
  { id: "t2", name: "중요" },
];

describe("WorkspaceTagList", () => {
  it("트리 태그 개수와 태그를 보여 주고, 고른 태그만 눌린 상태로 표시한다", () => {
    render(
      <WorkspaceTagList
        tags={tags}
        selectedTagId="t2"
        onSelectTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "태그 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "React" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "중요" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("태그를 누르면 그 태그의 ID를 넘긴다", async () => {
    const user = userEvent.setup();
    const onSelectTag = vi.fn();
    render(
      <WorkspaceTagList
        tags={tags}
        selectedTagId={null}
        onSelectTag={onSelectTag}
        onDeleteTag={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "React" }));

    expect(onSelectTag).toHaveBeenCalledExactlyOnceWith("t1");
  });

  it("칩의 X 버튼을 누르면 그 태그의 ID만 넘기고 선택은 하지 않는다", async () => {
    const user = userEvent.setup();
    const onSelectTag = vi.fn();
    const onDeleteTag = vi.fn();
    render(
      <WorkspaceTagList
        tags={tags}
        selectedTagId={null}
        onSelectTag={onSelectTag}
        onDeleteTag={onDeleteTag}
      />,
    );

    await user.click(screen.getByRole("button", { name: "중요 태그 삭제" }));

    expect(onDeleteTag).toHaveBeenCalledExactlyOnceWith("t2");
    expect(onSelectTag).not.toHaveBeenCalled();
  });

  it("머리 버튼으로 목록을 접고 편다", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceTagList
        tags={tags}
        selectedTagId={null}
        onSelectTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );
    const toggle = screen.getByRole("button", { name: "태그 2" });

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "React" }),
    ).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "React" })).toBeInTheDocument();
  });

  it("트리 태그가 없으면 추가하는 곳을 안내한다", () => {
    render(
      <WorkspaceTagList
        tags={[]}
        selectedTagId={null}
        onSelectTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    expect(
      screen.getByText("노드의 메모 패널에서 태그를 추가할 수 있습니다."),
    ).toBeInTheDocument();
  });
});
