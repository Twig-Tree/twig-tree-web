import { render, screen, waitFor } from "@testing-library/react";
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

/*
여러 단계 안내를 띄우는 쪽처럼 지금 단계를 state로 들고, 첫 단계에는 onPrevious를, 마지막 단계에는 onNext를 넘기지 않는다.
*/
function SteppedCardHarness({
  total,
  onDismiss,
}: {
  total: number;
  onDismiss: () => void;
}) {
  const [current, setCurrent] = useState(1);

  return (
    <CoachmarkCard
      title={`단계 ${current}`}
      onDismiss={onDismiss}
      step={{ current, total }}
      onPrevious={current > 1 ? () => setCurrent(current - 1) : undefined}
      onNext={current < total ? () => setCurrent(current + 1) : undefined}
    >
      안내 문구
    </CoachmarkCard>
  );
}

describe("CoachmarkCard 단계", () => {
  it("step이 없으면 번호와 이동 버튼을 그리지 않는다", () => {
    render(<CoachmarkCard onDismiss={vi.fn()}>안내 문구</CoachmarkCard>);

    expect(screen.queryByText(/단계 중/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "다음" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "완료" }),
    ).not.toBeInTheDocument();
  });

  it("첫 단계에는 번호와 다음 버튼만 있고, 화면 낭독기에는 몇 단계 중 몇 단계인지 읽힌다", () => {
    render(<SteppedCardHarness total={4} onDismiss={vi.fn()} />);

    expect(screen.getByText("4단계 중 1단계")).toBeInTheDocument();
    expect(screen.getByText("1/4")).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.queryByRole("button", { name: "이전" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("다음과 이전으로 단계를 오가고, 마지막 단계의 완료는 안내를 닫는다", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<SteppedCardHarness total={3} onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByText("단계 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByText("단계 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByText("단계 3")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "다음" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "완료" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("키보드로 다음을 눌러 마지막 단계에 와도 focus가 완료 버튼에 남는다", async () => {
    const user = userEvent.setup();

    render(<SteppedCardHarness total={2} onDismiss={vi.fn()} />);

    screen.getByRole("button", { name: "다음" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "완료" })).toHaveFocus();
  });

  it("두 번째 단계에서 이전을 누르면 이전 버튼이 사라지므로 focus를 다음 버튼으로 옮긴다", async () => {
    const user = userEvent.setup();

    render(<SteppedCardHarness total={3} onDismiss={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "다음" }));
    screen.getByRole("button", { name: "이전" }).focus();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "다음" })).toHaveFocus(),
    );
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
