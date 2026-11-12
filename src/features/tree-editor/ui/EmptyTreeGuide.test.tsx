import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyTreeGuide } from "./EmptyTreeGuide";

describe("EmptyTreeGuide", () => {
  it("빈 트리 안내와 직접 추가 버튼을 보여 주고, 누르면 루트를 추가한다", () => {
    const onAddRootNode = vi.fn();

    render(
      <EmptyTreeGuide
        onAddRootNode={onAddRootNode}
        isAddRootNodeDisabled={false}
      />,
    );

    expect(
      screen.getByRole("region", { name: "아직 트리가 없어요" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "직접 노드 추가" }));

    expect(onAddRootNode).toHaveBeenCalledOnce();
  });

  it("추가할 수 없는 동안에는 버튼을 막는다", () => {
    render(<EmptyTreeGuide onAddRootNode={vi.fn()} isAddRootNodeDisabled />);

    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "직접 노드 추가" })
        .disabled,
    ).toBe(true);
  });

  it("AI 입력 자리를 받으면 직접 추가와 함께 보여 준다", () => {
    render(
      <EmptyTreeGuide
        onAddRootNode={vi.fn()}
        isAddRootNodeDisabled={false}
        aiFillSlot={<textarea aria-label="프롬프트 입력" />}
      />,
    );

    expect(screen.getByRole("textbox", { name: "프롬프트 입력" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "직접 노드 추가" })).toBeTruthy();
  });

  it("AI 입력 자리가 없으면 직접 추가만 안내한다", () => {
    render(
      <EmptyTreeGuide onAddRootNode={vi.fn()} isAddRootNodeDisabled={false} />,
    );

    expect(
      screen.getByText("첫 노드를 추가해 트리를 시작해 보세요."),
    ).toBeTruthy();
  });
});
