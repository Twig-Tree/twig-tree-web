import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Coachmark } from "./Coachmark";
import { CoachmarkCard } from "./CoachmarkCard";

/*
기준 요소를 state로 받아 Coachmark에 넘기는 호출 방식을 그대로 재현한다.
*/
function CoachmarkHarness({ onDismiss }: { onDismiss: () => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <input ref={setAnchor} aria-label="주제" />
      <Coachmark anchor={anchor} title="첫 트리" onDismiss={onDismiss}>
        주제를 적어 보세요.
      </Coachmark>
    </>
  );
}

describe("CoachmarkCard", () => {
  it("문구와 닫기 버튼을 그리고, 닫기 버튼을 누르면 onDismiss를 부른다", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <CoachmarkCard title="안내 제목" onDismiss={onDismiss}>
        안내 문구
      </CoachmarkCard>,
    );

    expect(screen.getByRole("note", { name: "기능 안내" })).toHaveTextContent(
      "안내 제목안내 문구",
    );

    await user.click(screen.getByRole("button", { name: "안내 닫기" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("focus가 카드 안에 있을 때 Escape로 닫고, 들어오기 전 자리로 focus를 돌려준다", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onOuterKeyDown = vi.fn();

    render(
      <div onKeyDown={onOuterKeyDown}>
        <input aria-label="주제" />
        <CoachmarkCard onDismiss={onDismiss}>안내 문구</CoachmarkCard>
      </div>,
    );

    await user.click(screen.getByRole("textbox", { name: "주제" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "안내 닫기" })).toHaveFocus();
    onOuterKeyDown.mockClear(); // 여기까지 오는 Tab 입력은 감시 대상이 아니다.

    await user.keyboard("{Escape}");

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onOuterKeyDown).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "주제" })).toHaveFocus();
  });

  it("focus가 카드 밖에 있으면 Escape로 닫지 않는다", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <>
        <input aria-label="주제" />
        <CoachmarkCard onDismiss={onDismiss}>안내 문구</CoachmarkCard>
      </>,
    );

    await user.click(screen.getByRole("textbox", { name: "주제" }));
    await user.keyboard("{Escape}");

    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe("Coachmark", () => {
  it("기준 요소가 붙으면 body에 안내를 그리고, focus를 옮기지 않는다", async () => {
    const user = userEvent.setup();

    render(<CoachmarkHarness onDismiss={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: "주제" });
    await user.click(input);

    /*
    jsdom은 요소 크기를 0으로 재므로 hide middleware가 기준 요소를 가려진 것으로 보고 카드를 숨긴다.
    숨긴 요소는 role 이름으로 찾을 수 없어 문구로 찾는다. 숨김 여부는 보지 않는다.
    */
    const message = await screen.findByText("주제를 적어 보세요.");
    const note = message.closest('[role="note"]');

    expect(note?.parentElement).toBe(document.body);
    expect(screen.getByText("첫 트리")).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("기준 요소가 없으면 그리지 않는다", () => {
    render(
      <Coachmark anchor={null} onDismiss={vi.fn()}>
        안내 문구
      </Coachmark>,
    );

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
