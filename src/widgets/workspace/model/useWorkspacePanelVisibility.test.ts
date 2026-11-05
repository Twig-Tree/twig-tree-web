import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspacePanelVisibility } from "./useWorkspacePanelVisibility";

/*
jsdom에는 matchMedia가 없으므로, 화면 폭을 바꾸면 구독자에게 알리는 가짜를 둔다.
*/
let isNarrow = false;
const listeners = new Set<() => void>();

const setNarrowScreen = (nextIsNarrow: boolean) => {
  isNarrow = nextIsNarrow;
  act(() => listeners.forEach((listener) => listener()));
};

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return isNarrow;
      },
      addEventListener: (_: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  );
});

afterEach(() => {
  isNarrow = false;
  listeners.clear();
  vi.unstubAllGlobals();
});

describe("useWorkspacePanelVisibility", () => {
  it("넓은 화면에서는 열린 채 캔버스 옆에 붙어 시작한다", () => {
    const { result } = renderHook(() => useWorkspacePanelVisibility());

    expect(result.current.isPanelOpen).toBe(true);
    expect(result.current.isPanelOverlay).toBe(false);
  });

  it("좁은 화면에서는 닫힌 채 시작하고, 열면 캔버스 위에 겹쳐 띄운다", () => {
    isNarrow = true;
    const { result } = renderHook(() => useWorkspacePanelVisibility());

    expect(result.current.isPanelOpen).toBe(false);

    act(() => result.current.openPanel());

    expect(result.current.isPanelOpen).toBe(true);
    expect(result.current.isPanelOverlay).toBe(true);
  });

  it("화면이 좁아지면 닫고, 다시 넓어지면 연다", () => {
    const { result } = renderHook(() => useWorkspacePanelVisibility());

    setNarrowScreen(true);
    expect(result.current.isPanelOpen).toBe(false);

    setNarrowScreen(false);
    expect(result.current.isPanelOpen).toBe(true);
  });

  it("기준을 넘지 않는 동안에는 사용자가 닫은 상태를 유지한다", () => {
    const { result } = renderHook(() => useWorkspacePanelVisibility());

    act(() => result.current.closePanel());
    setNarrowScreen(false);

    expect(result.current.isPanelOpen).toBe(false);
  });
});
