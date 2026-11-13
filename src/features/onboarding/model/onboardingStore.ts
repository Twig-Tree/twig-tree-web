import {
  ONBOARDING_SCENARIOS,
  ONBOARDING_STORAGE_KEY,
  type OnboardingScenarioId,
  type OnboardingSeenRecord,
} from "./scenarios";

/*
본 기록과 도달한 상황을 담는 store. 테마 store와 같이 useSyncExternalStore로 구독한다.

본 기록은 localStorage가 원본이고, 여기 값은 그 사본이다. 저장소를 쓸 수 없는 환경에서는 사본만 바뀌어 지금 탭 안에서는 닫은 안내가 다시 뜨지 않는다.
도달한 상황은 화면이 마운트된 동안의 사실이라 저장하지 않는다.
*/
let seenRecord: OnboardingSeenRecord | null = null; // 아직 저장소를 읽지 않았으면 null
let reachedScenarioIds: ReadonlySet<OnboardingScenarioId> = new Set();
const listeners = new Set<() => void>();

const EMPTY_REACHED_SCENARIO_IDS: ReadonlySet<OnboardingScenarioId> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

/*
함수 이름 : parseSeenRecord
기능 : 저장소에서 읽은 문자열을 본 기록으로 바꾼다. 형식이 틀렸거나 없어진 상황의 기록은 버린다.
인자 : string | null raw -> 저장소의 값
반환값 : 본 기록. 읽을 수 없으면 빈 기록
*/
const parseSeenRecord = (raw: string | null): OnboardingSeenRecord => {
  if (raw === null) return {};

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof parsed !== "object" || parsed === null) return {};

  const record: OnboardingSeenRecord = {};

  for (const { id } of ONBOARDING_SCENARIOS) {
    const version = (parsed as Record<string, unknown>)[id];

    if (typeof version === "number") record[id] = version;
  }

  return record;
};

/*
함수 이름 : loadSeenRecordFromStorage
기능 : 저장소의 본 기록을 사본으로 읽어 온다. 저장소를 읽을 수 없으면 지금 사본을 유지하고, 사본도 없으면 빈 기록으로 둔다.
내용이 같으면 사본 객체를 바꾸지 않는다. 구독자가 같은 내용으로 다시 그리지 않게 하기 위해서다.
인자 : 없음
반환값 : 없음
*/
const loadSeenRecordFromStorage = (): void => {
  let loaded: OnboardingSeenRecord;

  try {
    loaded = parseSeenRecord(
      window.localStorage.getItem(ONBOARDING_STORAGE_KEY),
    );
  } catch {
    seenRecord ??= {};
    return;
  }

  if (JSON.stringify(loaded) !== JSON.stringify(seenRecord)) {
    seenRecord = loaded;
  }
};

/*
함수 이름 : writeSeenRecord
기능 : 본 기록을 바꾸고 저장한 뒤 구독자에게 알린다. 저장에 실패해도 사본은 바뀐다.
인자 : OnboardingSeenRecord record -> 새 본 기록
반환값 : 없음
*/
const writeSeenRecord = (record: OnboardingSeenRecord): void => {
  seenRecord = record;

  try {
    if (Object.keys(record).length === 0) {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify(record),
      );
    }
  } catch {
    // 저장에 실패하면 새로고침 뒤 안내가 다시 보일 뿐 지금 탭은 영향받지 않는다.
  }

  notifyListeners();
};

/*
함수 이름 : getSeenRecord
기능 : 지금 본 기록을 읽는다. 처음 부를 때 저장소에서 읽어 온다.
인자 : 없음
반환값 : 본 기록. 바뀌기 전까지 같은 객체를 돌려준다
*/
export const getSeenRecord = (): OnboardingSeenRecord => {
  if (seenRecord === null) loadSeenRecordFromStorage();

  return seenRecord ?? {};
};

/*
함수 이름 : getServerSeenRecord
기능 : 서버 렌더링과 hydration 중에 쓸 본 기록을 돌려준다. 서버는 저장값을 모르므로 아무 안내도 띄우지 않게 null을 돌려준다.
인자 : 없음
반환값 : null
*/
export const getServerSeenRecord = (): OnboardingSeenRecord | null => null;

/*
함수 이름 : markScenarioSeen
기능 : 안내를 닫았다고 기록한다. 지금 version을 함께 남겨, version이 바뀌면 다시 보이게 한다.
인자 : OnboardingScenarioId scenarioId -> 닫은 안내의 상황
반환값 : 없음
*/
export const markScenarioSeen = (scenarioId: OnboardingScenarioId): void => {
  const scenario = ONBOARDING_SCENARIOS.find(({ id }) => id === scenarioId);
  if (!scenario) return;

  const record = getSeenRecord();
  if (record[scenarioId] === scenario.version) return; // 이미 기록돼 있으면 저장과 알림을 건너뛴다.

  writeSeenRecord({ ...record, [scenarioId]: scenario.version });
};

/*
함수 이름 : resetSeenScenarios
기능 : 본 기록을 모두 지워 안내를 처음부터 다시 보이게 한다.
인자 : 없음
반환값 : 없음
*/
export const resetSeenScenarios = (): void => {
  writeSeenRecord({});
};

/*
함수 이름 : getReachedScenarioIds
기능 : 지금 화면이 도달한 상황을 읽는다.
인자 : 없음
반환값 : 도달한 상황 ID 묶음. 바뀌기 전까지 같은 객체를 돌려준다
*/
export const getReachedScenarioIds = (): ReadonlySet<OnboardingScenarioId> =>
  reachedScenarioIds;

/*
함수 이름 : getServerReachedScenarioIds
기능 : 서버 렌더링과 hydration 중에 쓸 도달한 상황을 돌려준다.
인자 : 없음
반환값 : 빈 묶음
*/
export const getServerReachedScenarioIds =
  (): ReadonlySet<OnboardingScenarioId> => EMPTY_REACHED_SCENARIO_IDS;

/*
함수 이름 : setScenarioReached
기능 : 화면이 어떤 상황에 도달했는지, 또는 벗어났는지 기록한다. 값이 그대로면 알리지 않는다.
인자 : OnboardingScenarioId scenarioId -> 상황
boolean isReached -> 도달했으면 true
반환값 : 없음
*/
export const setScenarioReached = (
  scenarioId: OnboardingScenarioId,
  isReached: boolean,
): void => {
  if (reachedScenarioIds.has(scenarioId) === isReached) return;

  const next = new Set(reachedScenarioIds);

  if (isReached) {
    next.add(scenarioId);
  } else {
    next.delete(scenarioId);
  }

  reachedScenarioIds = next;
  notifyListeners();
};

/*
함수 이름 : handleStorageEvent
기능 : 다른 탭이 본 기록을 바꾸면 이 탭의 사본도 맞춘다. 이벤트의 값이 아니라 저장소의 최신 값을 따른다.
인자 : StorageEvent event -> window의 storage 이벤트
반환값 : 없음
*/
const handleStorageEvent = (event: StorageEvent): void => {
  const isClearAll = event.key === null; // localStorage.clear()는 key를 null로 보낸다.

  if (!isClearAll && event.key !== ONBOARDING_STORAGE_KEY) return;

  loadSeenRecordFromStorage();
  notifyListeners();
};

/*
함수 이름 : subscribeOnboarding
기능 : 본 기록이나 도달한 상황이 바뀔 때 호출할 함수를 등록한다. 구독자가 있는 동안만 다른 탭의 변경을 듣는다.
듣지 않던 동안 다른 탭이 바꾼 값은 이벤트로 받지 못하므로, 첫 구독자가 생길 때 저장소를 다시 읽는다.
인자 : () => void onStoreChange -> 바뀌면 호출할 함수
반환값 : 구독 해제 함수
*/
export const subscribeOnboarding = (
  onStoreChange: () => void,
): (() => void) => {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
    if (seenRecord !== null) loadSeenRecordFromStorage();
  }

  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);

    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
};
