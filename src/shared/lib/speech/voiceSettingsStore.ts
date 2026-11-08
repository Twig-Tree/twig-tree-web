import {
  DEFAULT_VOICE_SETTINGS,
  getVoiceSettingsFromStoredValue,
  VOICE_SETTINGS_STORAGE_KEY,
  type VoiceSettings,
} from "./voiceSettings";

/*
저장소를 쓸 수 없는 환경에서도 지금 화면의 슬라이더와 재생에는 반영되도록 현재 값을 메모리에 둔다.
아직 읽지 않았으면 null이다.
*/
let currentVoiceSettings: VoiceSettings | null = null;

const listeners = new Set<() => void>();

const notifyListeners = () => listeners.forEach((listener) => listener());

/*
함수 이름 : getVoiceSettings
기능 : 현재 음성 설정을 읽는다. 값이 바뀌지 않으면 같은 객체를 돌려주므로 useSyncExternalStore의 스냅숏으로 쓸 수 있다.
인자 : 없음
반환값 : 현재 음성 설정
*/
export const getVoiceSettings = (): VoiceSettings => {
  if (currentVoiceSettings === null) {
    try {
      currentVoiceSettings = getVoiceSettingsFromStoredValue(
        window.localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY),
      );
    } catch {
      currentVoiceSettings = DEFAULT_VOICE_SETTINGS;
    }
  }

  return currentVoiceSettings;
};

/*
함수 이름 : getServerVoiceSettings
기능 : 서버 렌더링과 hydration 중에 쓸 음성 설정을 돌려준다. 서버는 저장값을 모르므로 기본값으로 그린다.
인자 : 없음
반환값 : 기본 음성 설정
*/
export const getServerVoiceSettings = (): VoiceSettings =>
  DEFAULT_VOICE_SETTINGS;

/*
함수 이름 : updateVoiceSettings
기능 : 음성 설정의 일부를 바꾸고 저장한다. 저장소를 쓸 수 없는 환경에서도 지금 화면에는 적용한다.
인자 : Partial<VoiceSettings> changes -> 바꿀 항목
반환값 : 없음
*/
export const updateVoiceSettings = (changes: Partial<VoiceSettings>): void => {
  currentVoiceSettings = { ...getVoiceSettings(), ...changes };
  notifyListeners();

  try {
    window.localStorage.setItem(
      VOICE_SETTINGS_STORAGE_KEY,
      JSON.stringify(currentVoiceSettings),
    );
  } catch {
    // 저장에 실패해도 이번 방문 동안은 고른 값을 쓴다.
  }
};

/*
함수 이름 : syncVoiceSettingsFromStorage
기능 : 저장된 음성 설정을 다시 읽어 현재 값에 반영한다. 내용이 같으면 구독자를 깨우지 않는다.
인자 : 없음
반환값 : 없음
*/
export const syncVoiceSettingsFromStorage = (): void => {
  let storedValue: string | null;

  try {
    storedValue = window.localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
  } catch {
    return;
  }

  const nextVoiceSettings = getVoiceSettingsFromStoredValue(storedValue);

  if (
    JSON.stringify(nextVoiceSettings) === JSON.stringify(getVoiceSettings())
  ) {
    return;
  }

  currentVoiceSettings = nextVoiceSettings;
  notifyListeners();
};

/*
key가 null이면 저장소 전체를 비운 것이다.
*/
const handleStorageEvent = (event: StorageEvent): void => {
  if (event.key === null || event.key === VOICE_SETTINGS_STORAGE_KEY) {
    syncVoiceSettingsFromStorage();
  }
};

/*
함수 이름 : subscribeVoiceSettings
기능 : 음성 설정 변경을 구독한다. 첫 구독자가 생길 때 저장값을 다시 읽어, 구독자가 없던 동안 다른 탭에서 바꾼 값을 놓치지 않는다.
인자 : () => void listener -> 값이 바뀌면 부를 함수
반환값 : 구독을 해제하는 함수
*/
export const subscribeVoiceSettings = (listener: () => void): (() => void) => {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
    syncVoiceSettingsFromStorage();
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
};
