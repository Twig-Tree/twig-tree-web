import {
  ONBOARDING_SCENARIOS,
  type OnboardingScenarioId,
  type OnboardingSeenRecord,
} from "../model/scenarios";

/*
함수 이름 : getActiveScenarioId
기능 : 지금 보여 줄 안내를 하나 고른다. 도달했고 아직 지금 version으로 닫지 않은 상황 중 목록에서 가장 앞의 것이다.
after가 있는 상황은 그 상황을 지금 version으로 닫은 뒤에만 고른다.
인자 : OnboardingSeenRecord seenRecord -> 본 기록
ReadonlySet<OnboardingScenarioId> reachedScenarioIds -> 지금 화면이 도달한 상황
반환값 : 보여 줄 상황 ID. 없으면 null
*/
export const getActiveScenarioId = (
  seenRecord: OnboardingSeenRecord,
  reachedScenarioIds: ReadonlySet<OnboardingScenarioId>,
): OnboardingScenarioId | null => {
  const isSeen = (scenarioId: string) =>
    ONBOARDING_SCENARIOS.some(
      ({ id, version }) => id === scenarioId && seenRecord[id] === version,
    );

  return (
    ONBOARDING_SCENARIOS.find(
      (scenario) =>
        reachedScenarioIds.has(scenario.id) &&
        !isSeen(scenario.id) &&
        (!("after" in scenario) || isSeen(scenario.after)),
    )?.id ?? null
  );
};
