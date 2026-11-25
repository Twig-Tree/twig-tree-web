import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLectureDemoPlayer } from "./useLectureDemoPlayer";

const STEP_DURATION_MS = 3600;

const renderPlayer = () =>
  renderHook(() =>
    useLectureDemoPlayer({ stepCount: 3, stepDurationMs: STEP_DURATION_MS }),
  );

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useLectureDemoPlayer", () => {
  it("멈춘 상태로 첫 단계에서 시작한다", () => {
    const { result } = renderPlayer();

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it("재생하지 않으면 시간이 지나도 단계가 그대로다", () => {
    const { result } = renderPlayer();

    act(() => vi.advanceTimersByTime(STEP_DURATION_MS * 2));

    expect(result.current.stepIndex).toBe(0);
  });

  it("재생 중에는 단계마다 정해진 시간이 지나면 다음 단계로 넘어간다", () => {
    const { result } = renderPlayer();

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(STEP_DURATION_MS - 1));
    expect(result.current.stepIndex).toBe(0);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.stepIndex).toBe(1);
  });

  it("재생 중 마지막 단계 다음에는 처음으로 돌아간다", () => {
    const { result } = renderPlayer();

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(STEP_DURATION_MS));
    act(() => vi.advanceTimersByTime(STEP_DURATION_MS));
    expect(result.current.isLastStep).toBe(true);

    act(() => vi.advanceTimersByTime(STEP_DURATION_MS));
    expect(result.current.stepIndex).toBe(0);
  });

  it("일시정지하면 단계가 더 넘어가지 않는다", () => {
    const { result } = renderPlayer();

    act(() => result.current.play());
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(STEP_DURATION_MS * 2));

    expect(result.current.stepIndex).toBe(0);
  });

  it("재생 중 직접 넘긴 단계도 정해진 시간을 온전히 보여준다", () => {
    const { result } = renderPlayer();

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(STEP_DURATION_MS - 100));
    act(() => result.current.goToNext());
    act(() => vi.advanceTimersByTime(STEP_DURATION_MS - 1));

    expect(result.current.stepIndex).toBe(1);
  });

  it("이전과 다음은 처음과 끝에서 멈춘다", () => {
    const { result } = renderPlayer();

    act(() => result.current.goToPrevious());
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.isFirstStep).toBe(true);

    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.stepIndex).toBe(2);
  });
});
