"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getActiveScenarioId } from "../lib/getActiveScenarioId";
import {
  getReachedScenarioIds,
  getSeenRecord,
  getServerReachedScenarioIds,
  getServerSeenRecord,
  markScenarioSeen,
  setScenarioReached,
  subscribeOnboarding,
} from "./onboardingStore";
import { ONBOARDING_SCENARIOS, type OnboardingScenarioId } from "./scenarios";

interface UseOnboardingHintOptions {
  isCompleted?: boolean; // 안내가 권한 동작을 사용자가 해 봤는지. true가 되면 닫은 것으로 기록한다. 예: 노드를 고르라는 안내에서 노드를 골랐을 때
}

/*
함수 이름 : useOnboardingHint
기능 : 화면이 상황에 도달했음을 알리고, 그 상황의 안내를 지금 보여 줄지와 닫는 함수를 돌려준다.
여러 상황에 동시에 도달하면 목록 순서대로 하나만 보인다. 서버 렌더링과 hydration 중에는 보이지 않는다.
인자 : OnboardingScenarioId scenarioId -> 안내할 상황
boolean isReached -> 화면이 지금 그 상황에 있는지. 예: 노드가 선택됐는지
UseOnboardingHintOptions options
반환값 : 보여 줄지 여부, 안내 제목·문구, 닫기 함수
*/
export const useOnboardingHint = (
  scenarioId: OnboardingScenarioId,
  isReached: boolean,
  { isCompleted = false }: UseOnboardingHintOptions = {},
) => {
  /*
  도달 여부는 마운트된 동안만 유효하다. 화면을 떠나거나 상황을 벗어나면 지워, 다음 순서의 안내가 막히지 않게 한다.
  */
  useEffect(() => {
    if (!isReached) return;

    setScenarioReached(scenarioId, true);

    return () => setScenarioReached(scenarioId, false);
  }, [scenarioId, isReached]);

  /*
  안내가 권한 동작을 이미 해 봤으면 안내를 볼 이유가 없다. 안내가 보이기 전에 해 본 경우에도 기록해 뒤늦게 뜨지 않게 한다.
  */
  useEffect(() => {
    if (isCompleted) markScenarioSeen(scenarioId);
  }, [scenarioId, isCompleted]);

  const seenRecord = useSyncExternalStore(
    subscribeOnboarding,
    getSeenRecord,
    getServerSeenRecord,
  );
  const reachedScenarioIds = useSyncExternalStore(
    subscribeOnboarding,
    getReachedScenarioIds,
    getServerReachedScenarioIds,
  );

  const isVisible =
    seenRecord !== null &&
    getActiveScenarioId(seenRecord, reachedScenarioIds) === scenarioId;

  const dismiss = useCallback(() => markScenarioSeen(scenarioId), [scenarioId]);

  const scenario = ONBOARDING_SCENARIOS.find(({ id }) => id === scenarioId);

  return {
    isVisible,
    title: scenario?.title ?? "",
    message: scenario?.message ?? "",
    dismiss,
  };
};
