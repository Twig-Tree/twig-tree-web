import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoEditor } from "./MemoEditor";

const createEditor = (initialMemo: string) => (
  <MemoEditor
    initialMemo={initialMemo}
    onSave={vi.fn()}
    isSaving={false}
    hasConflict={false}
    onRevert={vi.fn()}
  />
);

const getMemoInput = () => screen.getByRole<HTMLTextAreaElement>("textbox");

describe("MemoEditor", () => {
  it("입력을 고치지 않았으면 저장된 메모가 바뀔 때 새 값을 보여 준다", () => {
    const { rerender } = render(createEditor("이전 메모"));

    rerender(createEditor("다른 곳의 메모"));

    expect(getMemoInput().value).toBe("다른 곳의 메모");
  });

  it("입력을 고쳤으면 저장된 메모가 바뀌어도 초안을 유지한다", () => {
    const { rerender } = render(createEditor("이전 메모"));

    fireEvent.change(getMemoInput(), { target: { value: "내 초안" } });
    rerender(createEditor("다른 곳의 메모"));

    expect(getMemoInput().value).toBe("내 초안");
  });

  it("초안을 유지한 뒤 되돌리기를 누르면 새 값을 보여 준다", () => {
    const { rerender } = render(createEditor("이전 메모"));

    fireEvent.change(getMemoInput(), { target: { value: "내 초안" } });
    rerender(createEditor("다른 곳의 메모"));
    fireEvent.click(screen.getByRole("button", { name: "되돌리기" }));

    expect(getMemoInput().value).toBe("다른 곳의 메모");
  });
});
