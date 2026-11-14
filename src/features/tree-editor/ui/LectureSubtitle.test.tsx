import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LectureSubtitle } from "./LectureSubtitle";

const TEXT = "유럽과 아시아를 비교합니다";

const getVisibleText = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"] > span:first-child')
    ?.textContent;

const mockReducedMotion = (matches: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches } as MediaQueryList),
  );
};

describe("LectureSubtitle", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("화면 읽기 도구에는 처음부터 전체 문장을 알린다", () => {
    render(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );

    expect(screen.getByText(TEXT, { selector: "[aria-live]" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  /*
  라이브 영역은 이후 변경을 알리므로, 비트마다 새로 만들면 문장이 알려지지 않을 수 있다.
  */
  it("비트가 바뀌어도 라이브 영역은 그대로 두고 문장만 바꾸며, 글자는 처음부터 다시 드러낸다", () => {
    const NEXT_TEXT = "다음 문장입니다";
    const { container, rerender } = render(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );
    const liveRegion = container.querySelector("[aria-live]");

    act(() => vi.advanceTimersByTime(2500));
    expect(getVisibleText(container)).toBe(TEXT);

    rerender(
      <LectureSubtitle
        text={NEXT_TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-2"
      />,
    );

    expect(container.querySelector("[aria-live]")).toBe(liveRegion);
    expect(liveRegion).toHaveTextContent(NEXT_TEXT);
    expect(getVisibleText(container)).toBe("");
  });

  it("재생하는 동안 글자를 차례로 드러내 내레이션 시간 안에 모두 보여 준다", () => {
    const { container } = render(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );

    expect(getVisibleText(container)).toBe("");

    act(() => vi.advanceTimersByTime(800));
    const partial = getVisibleText(container) ?? "";
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(TEXT.length);
    expect(TEXT.startsWith(partial)).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(getVisibleText(container)).toBe(TEXT);
  });

  it("일시정지하면 글자가 더 드러나지 않는다", () => {
    const { container, rerender } = render(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );

    act(() => vi.advanceTimersByTime(600));
    rerender(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying={false}
        revealKey="beat-1"
      />,
    );
    const pausedText = getVisibleText(container);

    act(() => vi.advanceTimersByTime(3000));
    expect(getVisibleText(container)).toBe(pausedText);
    expect(pausedText).not.toBe(TEXT);
  });

  /*
  재개하면 강의 플레이어가 문장을 처음부터 다시 읽으므로, 자막이 멈춘 지점부터 이어 가면 음성과 어긋난다.
  */
  it("재개하면 음성과 함께 처음부터 다시 드러낸다", () => {
    const { container, rerender } = render(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );

    act(() => vi.advanceTimersByTime(1000));
    expect(getVisibleText(container)).not.toBe("");

    rerender(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying={false}
        revealKey="beat-1"
      />,
    );
    rerender(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );

    expect(getVisibleText(container)).toBe("");
  });

  it("동작 줄이기를 켰으면 처음부터 모두 보여 준다", () => {
    mockReducedMotion(true);

    const { container } = render(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying
        revealKey="beat-1"
      />,
    );

    expect(getVisibleText(container)).toBe(TEXT);
  });
});
