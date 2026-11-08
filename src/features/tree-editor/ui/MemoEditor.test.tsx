import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEditingStore } from "../model/sync/editingStore";
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

  /*
  저장은 앞뒤 공백을 제거한 값을 보내므로, 공백만 다른 입력이 남으면 저장 시 새 메모를 옛 내용으로 덮어쓴다.
  */
  it("입력이 공백만 다르면 저장된 메모가 바뀔 때 새 값을 보여 준다", () => {
    const { rerender } = render(createEditor("이전 메모"));

    fireEvent.change(getMemoInput(), { target: { value: "이전 메모 " } });
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

describe("MemoEditor의 미저장 입력 알림", () => {
  afterEach(() => {
    cleanup();
    useEditingStore.setState({ isMemoDirty: false });
  });

  const isMemoDirty = () => useEditingStore.getState().isMemoDirty;

  it("입력을 고치면 알리고, 원래 내용으로 돌아오면 해제한다", () => {
    render(createEditor("이전 메모"));
    expect(isMemoDirty()).toBe(false);

    fireEvent.change(getMemoInput(), { target: { value: "내 초안" } });
    expect(isMemoDirty()).toBe(true);

    fireEvent.change(getMemoInput(), { target: { value: "이전 메모 " } });
    expect(isMemoDirty()).toBe(false);
  });

  it("입력이 남은 채 사라지면 해제한다", () => {
    const { unmount } = render(createEditor("이전 메모"));

    fireEvent.change(getMemoInput(), { target: { value: "내 초안" } });
    unmount();

    expect(isMemoDirty()).toBe(false);
  });
});
