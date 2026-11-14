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
      <LectureSubtitle text={TEXT} narrationDurationMs={2000} isPlaying />,
    );

    expect(screen.getByText(TEXT, { selector: "[aria-live]" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("재생하는 동안 글자를 차례로 드러내 내레이션 시간 안에 모두 보여 준다", () => {
    const { container } = render(
      <LectureSubtitle text={TEXT} narrationDurationMs={2000} isPlaying />,
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
      <LectureSubtitle text={TEXT} narrationDurationMs={2000} isPlaying />,
    );

    act(() => vi.advanceTimersByTime(600));
    rerender(
      <LectureSubtitle
        text={TEXT}
        narrationDurationMs={2000}
        isPlaying={false}
      />,
    );
    const pausedText = getVisibleText(container);

    act(() => vi.advanceTimersByTime(3000));
    expect(getVisibleText(container)).toBe(pausedText);
    expect(pausedText).not.toBe(TEXT);
  });

  it("동작 줄이기를 켰으면 처음부터 모두 보여 준다", () => {
    mockReducedMotion(true);

    const { container } = render(
      <LectureSubtitle text={TEXT} narrationDurationMs={2000} isPlaying />,
    );

    expect(getVisibleText(container)).toBe(TEXT);
  });
});
