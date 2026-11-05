import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KebabMenu } from "./KebabMenu";

describe("KebabMenu", () => {
  it("checked를 받은 항목은 선택 상태를 알리는 항목으로 그린다", async () => {
    const user = userEvent.setup();

    render(
      <KebabMenu
        items={[
          { id: "on", label: "켜짐", checked: true },
          { id: "off", label: "꺼짐", checked: false },
          { id: "plain", label: "일반" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "더보기" }));

    expect(screen.getByRole("menuitemradio", { name: "켜짐" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: "꺼짐" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("menuitem", { name: "일반" })).not.toHaveAttribute(
      "aria-checked",
    );
  });

  it("항목을 고르면 메뉴를 닫고 callback을 실행한다", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <KebabMenu
        items={[{ id: "a", label: "항목", checked: false, onSelect }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "더보기" }));
    await user.click(screen.getByRole("menuitemradio", { name: "항목" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "더보기" })).toHaveFocus();
  });

  it("화살표로 선택 가능한 항목 사이를 돌아가며 이동한다", async () => {
    const user = userEvent.setup();

    render(
      <KebabMenu
        items={[
          { id: "first", label: "첫째" },
          { id: "disabled", label: "비활성", disabled: true },
          { id: "last", label: "마지막" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "더보기" }));

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "첫째" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "마지막" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "첫째" })).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "마지막" })).toHaveFocus();
  });

  it("트리거에서 위 화살표를 누르면 마지막 항목으로 간다", async () => {
    const user = userEvent.setup();

    render(
      <KebabMenu
        items={[
          { id: "first", label: "첫째" },
          { id: "last", label: "마지막" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "더보기" }));
    await user.keyboard("{ArrowUp}");

    expect(screen.getByRole("menuitem", { name: "마지막" })).toHaveFocus();
  });
});
