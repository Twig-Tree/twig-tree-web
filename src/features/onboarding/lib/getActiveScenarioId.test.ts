import { describe, expect, it } from "vitest";
import {
  ONBOARDING_SCENARIOS,
  type OnboardingScenarioId,
} from "../model/scenarios";
import { getActiveScenarioId } from "./getActiveScenarioId";

const [first, second] = ONBOARDING_SCENARIOS;

const reached = (...ids: OnboardingScenarioId[]) => new Set(ids);

describe("getActiveScenarioId", () => {
  it("도달한 상황이 없으면 null이다", () => {
    expect(getActiveScenarioId({}, reached())).toBeNull();
  });

  it("여러 상황에 도달하면 목록에서 앞의 것을 고른다", () => {
    expect(getActiveScenarioId({}, reached(second.id, first.id))).toBe(
      first.id,
    );
  });

  it("앞의 안내를 닫았으면 다음 것을 고른다", () => {
    expect(
      getActiveScenarioId(
        { [first.id]: first.version },
        reached(first.id, second.id),
      ),
    ).toBe(second.id);
  });

  it("앞의 상황에 도달하지 않았으면 뒤의 상황을 바로 고른다", () => {
    expect(getActiveScenarioId({}, reached(second.id))).toBe(second.id);
  });

  it("다른 version으로 닫은 안내는 다시 고른다", () => {
    expect(
      getActiveScenarioId({ [first.id]: first.version - 1 }, reached(first.id)),
    ).toBe(first.id);
  });
});
