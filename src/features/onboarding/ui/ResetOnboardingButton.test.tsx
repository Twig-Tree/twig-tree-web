import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useToastStore } from "@/src/shared/ui/toast/toastStore";
import { resetSeenScenarios } from "../model/onboardingStore";
import {
  ONBOARDING_SCENARIOS,
  ONBOARDING_STORAGE_KEY,
} from "../model/scenarios";
import { useOnboardingHint } from "../model/useOnboardingHint";
import { ResetOnboardingButton } from "./ResetOnboardingButton";

const [first] = ONBOARDING_SCENARIOS;

afterEach(() => {
  resetSeenScenarios();
  window.localStorage.clear();
  useToastStore.setState({ toasts: [] });
});

describe("ResetOnboardingButton", () => {
  it("누르면 닫은 안내가 다시 보이고 완료를 알린다", async () => {
    const user = userEvent.setup();
    const { result } = renderHook(() => useOnboardingHint(first.id, true));

    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);

    render(<ResetOnboardingButton />);
    await user.click(screen.getByRole("button", { name: "안내 다시 보기" }));

    expect(result.current.isVisible).toBe(true);
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        message: "대시보드부터 안내가 다시 보입니다.",
      }),
    ]);
  });
});
