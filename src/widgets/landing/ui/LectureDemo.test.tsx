import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntersectionObserver } from "@/src/tests/helpers/mockIntersectionObserver";
import { DEMO_NOTES, DEMO_STEP_DURATION_MS } from "../model/lectureDemoData";
import { LectureDemo } from "./LectureDemo";

const reducedMotion = vi.hoisted(() => ({ value: false }));

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => reducedMotion.value,
}));

let notifyIntersection: (isIntersecting: boolean) => void;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  reducedMotion.value = false;
  ({ notifyIntersection } = mockIntersectionObserver());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const advanceOneStep = () =>
  act(() => vi.advanceTimersByTime(DEMO_STEP_DURATION_MS));

const setup = () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<LectureDemo />);
  return { user };
};

describe("LectureDemo", () => {
  it("첫 노드의 해설과 진행 상태를 보여준다", () => {
    setup();

    expect(screen.getByText(DEMO_NOTES.A)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.getByRole("button", { name: "이전 노드" })).toBeDisabled();
  });

  it("화면에 들어오면 자동 재생하고, 강의 순서대로 해설이 바뀐다", () => {
    setup();

    notifyIntersection(true);
    expect(
      screen.getByRole("button", { name: "일시정지" }),
    ).toBeInTheDocument();

    advanceOneStep();
    expect(screen.getByText(DEMO_NOTES.B)).toBeInTheDocument();

    advanceOneStep();
    expect(screen.getByText(DEMO_NOTES.E)).toBeInTheDocument();
  });

  it("화면을 벗어나면 멈춘다", () => {
    setup();

    notifyIntersection(true);
    notifyIntersection(false);
    advanceOneStep();

    expect(screen.getByText(DEMO_NOTES.A)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument();
  });

  it("직접 멈춘 데모는 화면에 다시 들어와도 자동 재생하지 않는다", async () => {
    const { user } = setup();

    notifyIntersection(true);
    await user.click(screen.getByRole("button", { name: "일시정지" }));
    notifyIntersection(false);
    notifyIntersection(true);
    advanceOneStep();

    expect(screen.getByText(DEMO_NOTES.A)).toBeInTheDocument();
  });

  it("움직임을 줄인 사용자에게는 자동 재생하지 않는다", () => {
    reducedMotion.value = true;
    setup();

    notifyIntersection(true);
    advanceOneStep();

    expect(screen.getByText(DEMO_NOTES.A)).toBeInTheDocument();
  });

  it("다음과 이전 버튼으로 노드를 옮긴다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "다음 노드" }));
    expect(screen.getByText(DEMO_NOTES.B)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );

    await user.click(screen.getByRole("button", { name: "이전 노드" }));
    expect(screen.getByText(DEMO_NOTES.A)).toBeInTheDocument();
  });

  it("해설 문단은 멈춰 있을 때만 바뀐 내용을 읽어 준다", () => {
    setup();
    const narration = screen.getByText(DEMO_NOTES.A);

    expect(narration).toHaveAttribute("aria-live", "polite");

    notifyIntersection(true);
    expect(narration).toHaveAttribute("aria-live", "off");
  });
});
