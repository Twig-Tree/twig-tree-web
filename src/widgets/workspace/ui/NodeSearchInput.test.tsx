import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, it, expect } from "vitest";
import { NodeSearchInput } from "./NodeSearchInput";

/*
검색어 state는 부모가 갖는다. 지우기 동작을 실제 입력값으로 확인하기 위해 부모 역할만 하는 감싸개를 둔다.
*/
function SearchInputHarness() {
  const [value, setValue] = useState("");

  return (
    <NodeSearchInput
      value={value}
      onChange={setValue}
      onClear={() => setValue("")}
    />
  );
}

describe("NodeSearchInput", () => {
  it("검색어가 있을 때만 지우기 버튼을 보여 준다", async () => {
    const user = userEvent.setup();
    render(<SearchInputHarness />);

    expect(
      screen.queryByRole("button", { name: "검색어 지우기" }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "노드 검색" }), "상태");

    expect(
      screen.getByRole("button", { name: "검색어 지우기" }),
    ).toBeInTheDocument();
  });

  it("지우기 버튼을 누르면 검색어를 지우고 입력창으로 포커스를 돌려준다", async () => {
    const user = userEvent.setup();
    render(<SearchInputHarness />);
    const input = screen.getByRole("textbox", { name: "노드 검색" });

    await user.type(input, "상태");
    await user.click(screen.getByRole("button", { name: "검색어 지우기" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("Escape를 누르면 검색어를 지운다", async () => {
    const user = userEvent.setup();
    render(<SearchInputHarness />);
    const input = screen.getByRole("textbox", { name: "노드 검색" });

    await user.type(input, "상태");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue("");
  });
});
