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
  });
});
