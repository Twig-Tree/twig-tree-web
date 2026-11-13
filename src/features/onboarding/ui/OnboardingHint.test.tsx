import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { resetSeenScenarios } from "../model/onboardingStore";
import { ONBOARDING_SCENARIOS } from "../model/scenarios";
import { OnboardingHint } from "./OnboardingHint";

const [first] = ONBOARDING_SCENARIOS;

function OnboardingHintHarness({ isReached }: { isReached: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <div ref={setAnchor}>입력 영역</div>
      <OnboardingHint
        scenarioId={first.id}
        anchor={anchor}
        isReached={isReached}
      />
    </>
  );
}

afterEach(() => {
  resetSeenScenarios();
  window.localStorage.clear();
});

describe("OnboardingHint", () => {
  /*
  jsdom은 요소 크기를 0으로 재 카드가 visibility: hidden으로 그려지므로, role 대신 문구로 찾는다.
  */
  it("상황에 도달하면 문구를 띄우고, 닫으면 사라진다", async () => {
    const user = userEvent.setup();

    render(<OnboardingHintHarness isReached />);

    expect(await screen.findByText(first.message)).toBeInTheDocument();

    await user.click(screen.getByLabelText("안내 닫기"));

    expect(screen.queryByText(first.message)).not.toBeInTheDocument();
  });

  it("상황에 도달하지 않았으면 띄우지 않는다", () => {
    render(<OnboardingHintHarness isReached={false} />);

    expect(screen.queryByText(first.message)).not.toBeInTheDocument();
  });
});
