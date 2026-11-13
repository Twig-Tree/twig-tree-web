import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ONBOARDING_SCENARIOS, ONBOARDING_STORAGE_KEY } from "./scenarios";

const tourScenario = ONBOARDING_SCENARIOS.find(
  (scenario) => "steps" in scenario,
)!;
const singleScenario = ONBOARDING_SCENARIOS.find(
  (scenario) => !("steps" in scenario),
)!;
const tourSteps = "steps" in tourScenario ? tourScenario.steps : [];

/*
store는 모듈 상태라 테스트끼리 기록이 이어진다. 매번 모듈을 새로 읽어 첫 방문처럼 시작한다.
*/
const loadUseOnboardingTour = async () => {
  vi.resetModules();

  return (await import("./useOnboardingTour")).useOnboardingTour;
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("useOnboardingTour", () => {
  it("첫 단계부터 보이고, 다음·이전으로 단계를 오간다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const { result } = renderHook(() =>
      useOnboardingTour(tourScenario.id, true),
    );

    expect(result.current.isVisible).toBe(true);
    expect(result.current.step).toEqual(tourSteps[0]);
    expect(result.current.progress).toEqual({
      current: 1,
      total: tourSteps.length,
    });
    expect(result.current.goToPrevious).toBeUndefined();

    act(() => result.current.goToNext?.());
    expect(result.current.step).toEqual(tourSteps[1]);
    expect(result.current.progress.current).toBe(2);

    act(() => result.current.goToPrevious?.());
    expect(result.current.step).toEqual(tourSteps[0]);
  });

  it("마지막 단계에는 다음이 없고, 닫으면 본 것으로 기록한다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const { result } = renderHook(() =>
      useOnboardingTour(tourScenario.id, true),
    );

    for (let index = 1; index < tourSteps.length; index += 1) {
      act(() => result.current.goToNext?.());
    }

    expect(result.current.step).toEqual(tourSteps.at(-1));
    expect(result.current.goToNext).toBeUndefined();

    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) ?? "{}"),
    ).toEqual({ [tourScenario.id]: tourScenario.version });
  });

  it("상황을 벗어나면 기록하지 않고 숨었다가, 다시 도달하면 첫 단계부터 보인다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const { result, rerender } = renderHook(
      ({ isReached }) => useOnboardingTour(tourScenario.id, isReached),
      { initialProps: { isReached: true } },
    );

    act(() => result.current.goToNext?.());
    act(() => result.current.goToNext?.());
    expect(result.current.progress.current).toBe(3);

    rerender({ isReached: false });
    expect(result.current.isVisible).toBe(false);
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();

    rerender({ isReached: true });
    expect(result.current.isVisible).toBe(true);
    expect(result.current.step).toEqual(tourSteps[0]);
  });

  it("화면에 없는 target의 단계는 건너뛰고, 번호도 남은 단계로 센다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const [first, , third] = tourSteps;
    const { result } = renderHook(() =>
      useOnboardingTour(tourScenario.id, true, {
        availableTargets: [first.target, third.target],
      }),
    );

    expect(result.current.step).toEqual(first);
    expect(result.current.progress).toEqual({ current: 1, total: 2 });

    act(() => result.current.goToNext?.());
    expect(result.current.step).toEqual(third);
    expect(result.current.goToNext).toBeUndefined();
  });

  it("투어 중 지금 단계의 요소가 사라지면 남은 마지막 단계에 머문다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const allTargets = tourSteps.map(({ target }) => target);
    const { result, rerender } = renderHook(
      ({ availableTargets }) =>
        useOnboardingTour(tourScenario.id, true, { availableTargets }),
      { initialProps: { availableTargets: allTargets } },
    );

    for (let index = 1; index < tourSteps.length; index += 1) {
      act(() => result.current.goToNext?.());
    }

    rerender({ availableTargets: allTargets.slice(0, -1) });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.step).toEqual(tourSteps.at(-2));
    expect(result.current.progress).toEqual({
      current: tourSteps.length - 1,
      total: tourSteps.length - 1,
    });
  });

  it("가리킬 요소가 하나도 없으면 보이지 않는다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const { result } = renderHook(() =>
      useOnboardingTour(tourScenario.id, true, { availableTargets: [] }),
    );

    expect(result.current.isVisible).toBe(false);
  });

  it("단계가 없는 상황이면 보이지 않는다", async () => {
    const useOnboardingTour = await loadUseOnboardingTour();
    const { result } = renderHook(() =>
      useOnboardingTour(singleScenario.id, true),
    );

    expect(result.current.isVisible).toBe(false);
    expect(result.current.step).toBeNull();
  });
});
