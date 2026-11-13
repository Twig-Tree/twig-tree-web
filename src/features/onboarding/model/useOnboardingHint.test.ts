import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ONBOARDING_SCENARIOS, ONBOARDING_STORAGE_KEY } from "./scenarios";

const [first, second] = ONBOARDING_SCENARIOS;

/*
store는 모듈 상태라 테스트끼리 기록이 이어진다. 매번 모듈을 새로 읽어 첫 방문처럼 시작한다.
*/
const loadModules = async () => {
  vi.resetModules();

  const [{ useOnboardingHint }, store] = await Promise.all([
    import("./useOnboardingHint"),
    import("./onboardingStore"),
  ]);

  return { useOnboardingHint, ...store };
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useOnboardingHint", () => {
  it("상황에 도달하면 보이고, 닫으면 다시 뜨지 않는다", async () => {
    const { useOnboardingHint } = await loadModules();

    const { result, rerender } = renderHook(
      ({ isReached }) => useOnboardingHint(first.id, isReached),
      { initialProps: { isReached: false } },
    );

    expect(result.current.isVisible).toBe(false);

    rerender({ isReached: true });
    expect(result.current.isVisible).toBe(true);
    expect(result.current.title).toBe(first.title);
    expect(result.current.message).toBe(first.message);

    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);

    expect(
      JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) ?? "{}"),
    ).toEqual({ [first.id]: first.version });
  });

  it("저장소에 지금 version으로 닫은 기록이 있으면 보이지 않는다", async () => {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ [first.id]: first.version }),
    );
    const { useOnboardingHint } = await loadModules();

    const { result } = renderHook(() => useOnboardingHint(first.id, true));

    expect(result.current.isVisible).toBe(false);
  });

  it("저장된 version이 다르면 다시 보인다", async () => {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ [first.id]: first.version - 1 }),
    );
    const { useOnboardingHint } = await loadModules();

    const { result } = renderHook(() => useOnboardingHint(first.id, true));

    expect(result.current.isVisible).toBe(true);
  });

  it("두 상황에 함께 도달하면 앞의 것부터 하나씩 보인다", async () => {
    const { useOnboardingHint } = await loadModules();

    const { result } = renderHook(() => ({
      first: useOnboardingHint(first.id, true),
      second: useOnboardingHint(second.id, true),
    }));

    expect(result.current.first.isVisible).toBe(true);
    expect(result.current.second.isVisible).toBe(false);

    act(() => result.current.first.dismiss());

    expect(result.current.first.isVisible).toBe(false);
    expect(result.current.second.isVisible).toBe(true);
  });

  it("앞의 상황을 벗어나면 뒤의 안내가 보인다", async () => {
    const { useOnboardingHint } = await loadModules();

    const { result, rerender } = renderHook(
      ({ isFirstReached }) => ({
        first: useOnboardingHint(first.id, isFirstReached),
        second: useOnboardingHint(second.id, true),
      }),
      { initialProps: { isFirstReached: true } },
    );

    expect(result.current.second.isVisible).toBe(false);

    rerender({ isFirstReached: false });

    expect(result.current.second.isVisible).toBe(true);
  });

  it("본 기록을 지우면 닫은 안내가 다시 보인다", async () => {
    const { useOnboardingHint, resetSeenScenarios } = await loadModules();

    const { result } = renderHook(() => useOnboardingHint(first.id, true));

    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);

    act(() => resetSeenScenarios());

    expect(result.current.isVisible).toBe(true);
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
  });

  it("다른 탭이 안내를 닫으면 이 탭에서도 사라진다", async () => {
    const { useOnboardingHint } = await loadModules();

    const { result } = renderHook(() => useOnboardingHint(first.id, true));
    expect(result.current.isVisible).toBe(true);

    act(() => {
      window.localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ [first.id]: first.version }),
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: ONBOARDING_STORAGE_KEY }),
      );
    });

    expect(result.current.isVisible).toBe(false);
  });

  it("저장소를 쓸 수 없어도 이 탭에서는 닫은 안내가 다시 뜨지 않는다", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { useOnboardingHint } = await loadModules();

    const { result } = renderHook(() => useOnboardingHint(first.id, true));
    expect(result.current.isVisible).toBe(true);

    act(() => result.current.dismiss());

    expect(result.current.isVisible).toBe(false);
  });

  it("권한 동작을 해 보면 닫은 것으로 기록한다", async () => {
    const { useOnboardingHint } = await loadModules();

    const { result, rerender } = renderHook(
      ({ isCompleted }) => useOnboardingHint(first.id, true, { isCompleted }),
      { initialProps: { isCompleted: false } },
    );
    expect(result.current.isVisible).toBe(true);

    rerender({ isCompleted: true });

    expect(result.current.isVisible).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) ?? "{}"),
    ).toEqual({ [first.id]: first.version });
  });

  it("안내가 보이기 전에 권한 동작을 해 봐도 기록해 뒤늦게 뜨지 않는다", async () => {
    const { useOnboardingHint } = await loadModules();

    const { result, rerender } = renderHook(
      ({ isReached }) =>
        useOnboardingHint(first.id, isReached, { isCompleted: true }),
      { initialProps: { isReached: false } },
    );

    rerender({ isReached: true });

    expect(result.current.isVisible).toBe(false);
  });

  it("이미 기록된 안내를 다시 닫아도 저장하지 않는다", async () => {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ [first.id]: first.version }),
    );
    const { markScenarioSeen } = await loadModules();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    markScenarioSeen(first.id);

    expect(setItem).not.toHaveBeenCalled();
  });

  it("형식이 틀린 저장값은 빈 기록으로 읽는다", async () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "not-json");
    const { useOnboardingHint } = await loadModules();

    const { result } = renderHook(() => useOnboardingHint(first.id, true));

    expect(result.current.isVisible).toBe(true);
  });
});
