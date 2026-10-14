import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NodeResultList } from "./NodeResultList";

const results = [
  { clientId: "c1", label: "React 기초", isMemoMatched: false },
  { clientId: "c2", label: "상태 관리", isMemoMatched: true },
];

describe("NodeResultList", () => {
  it("결과 개수와 노드 이름을 보여 주고, 메모에서 일치한 항목에만 메모 표시를 붙인다", () => {
    render(
      <NodeResultList
        results={results}
        emptyMessage="일치하는 노드가 없습니다."
        onSelect={() => {}}
        isSelectDisabled={false}
      />,
    );

    expect(screen.getByText("결과 2개")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "React 기초" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "상태 관리, 메모에서 일치" }),
    ).toBeInTheDocument();
  });

  it("결과가 없으면 안내 문구만 보여 준다", () => {
    render(
      <NodeResultList
        results={[]}
        emptyMessage="일치하는 노드가 없습니다."
        onSelect={() => {}}
        isSelectDisabled={false}
      />,
    );

    expect(screen.getByText("일치하는 노드가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("항목을 누르면 그 결과를 넘긴다", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <NodeResultList
        results={results}
        emptyMessage="일치하는 노드가 없습니다."
        onSelect={handleSelect}
        isSelectDisabled={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "상태 관리, 메모에서 일치" }),
    );

    expect(handleSelect).toHaveBeenCalledExactlyOnceWith(results[1]);
  });

  it("클릭이 막혀 있으면 항목을 눌러도 결과를 넘기지 않는다", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <NodeResultList
        results={results}
        emptyMessage="일치하는 노드가 없습니다."
        onSelect={handleSelect}
        isSelectDisabled
      />,
    );

    await user.click(screen.getByRole("button", { name: "React 기초" }));

    expect(screen.getByRole("button", { name: "React 기초" })).toBeDisabled();
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
