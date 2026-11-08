import {
  DARK_COLOR_SCHEME_QUERY,
  DEFAULT_THEME,
  isThemeId,
  isThemePreference,
  SYSTEM_DARK_THEME,
  SYSTEM_LIGHT_THEME,
  SYSTEM_THEME,
  THEME_STORAGE_KEY,
  type ThemeId,
  type ThemePreference,
} from "./themes";

const THEME_CHANGE_EVENT = "twig-tree:theme-change";

/*
함수 이름 : getThemeForPreference
기능 : 사용자가 고른 값을 실제로 적용할 테마로 바꾼다. 시스템 설정이면 OS의 색상 모드를 읽는다.
인자 : ThemePreference preference -> 사용자가 고른 값
반환값 : 적용할 테마
*/
const getThemeForPreference = (preference: ThemePreference): ThemeId => {
  if (preference !== SYSTEM_THEME) return preference;

  return window.matchMedia?.(DARK_COLOR_SCHEME_QUERY).matches
    ? SYSTEM_DARK_THEME
    : SYSTEM_LIGHT_THEME;
};

/*
함수 이름 : applyThemePreference
기능 : 사용자가 고른 값을 문서에 반영하고 구독자에게 알린다. 화면의 CSS가 읽는 data-theme을 현재 테마의 단일 원본으로 둔다.
시스템 설정을 골랐다는 사실은 data-theme만으로 알 수 없어 data-theme-preference에 따로 남긴다.
인자 : ThemePreference preference -> 적용할 값
반환값 : 없음
*/
const applyThemePreference = (preference: ThemePreference): void => {
  const { dataset } = document.documentElement;

  dataset.theme = getThemeForPreference(preference);

  if (preference === SYSTEM_THEME) {
    dataset.themePreference = SYSTEM_THEME;
  } else {
    delete dataset.themePreference;
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
};

/*
함수 이름 : getCurrentTheme
기능 : 지금 문서에 적용된 테마를 읽는다.
인자 : 없음
반환값 : 현재 테마. 문서의 값이 제품에 없는 테마면 기본 테마
*/
export const getCurrentTheme = (): ThemeId => {
  const themeId = document.documentElement.dataset.theme;

  return isThemeId(themeId) ? themeId : DEFAULT_THEME;
};

/*
함수 이름 : getServerTheme
기능 : 서버 렌더링과 hydration 중에 쓸 테마를 돌려준다. 서버는 저장값을 모르므로 기본 테마로 그린다.
인자 : 없음
반환값 : 기본 테마
*/
export const getServerTheme = (): ThemeId => DEFAULT_THEME;

/*
함수 이름 : getCurrentThemePreference
기능 : 사용자가 지금 고른 값을 읽는다.
인자 : 없음
반환값 : 시스템 설정을 골랐으면 system, 아니면 현재 테마
*/
export const getCurrentThemePreference = (): ThemePreference =>
  document.documentElement.dataset.themePreference === SYSTEM_THEME
    ? SYSTEM_THEME
    : getCurrentTheme();

/*
함수 이름 : getServerThemePreference
기능 : 서버 렌더링과 hydration 중에 쓸 선택값을 돌려준다. 서버는 저장값을 모르므로 기본 테마로 그린다.
인자 : 없음
반환값 : 기본 테마
*/
export const getServerThemePreference = (): ThemePreference => DEFAULT_THEME;

/*
함수 이름 : setTheme
기능 : 사용자가 고른 값을 적용하고 저장한다. 저장소를 쓸 수 없는 환경에서도 지금 화면에는 적용한다.
나중에 계정 저장을 붙일 때 저장 위치를 바꾸는 곳이 여기다.
인자 : ThemePreference preference -> 사용자가 고른 값
반환값 : 없음
*/
export const setTheme = (preference: ThemePreference): void => {
  applyThemePreference(preference);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // 저장에 실패하면 새로고침 때 기본 테마로 돌아갈 뿐 지금 화면은 영향받지 않는다.
  }
};

/*
함수 이름 : subscribeTheme
기능 : 테마가 바뀔 때 호출할 함수를 등록한다. useSyncExternalStore의 구독 함수로 쓴다.
인자 : () => void onStoreChange -> 테마가 바뀌면 호출할 함수
반환값 : 구독 해제 함수
*/
export const subscribeTheme = (onStoreChange: () => void): (() => void) => {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
};

/*
함수 이름 : syncThemeFromStorage
기능 : 저장된 선택값을 다시 읽어 문서에 적용한다. 저장값이 지워졌거나 제품에 없는 테마면 기본 테마로 돌아간다. 저장소를 읽을 수 없으면 지금 테마를 유지한다.
인자 : 없음
반환값 : 없음
*/
export const syncThemeFromStorage = (): void => {
  let storedPreference: string | null;

  try {
    storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return;
  }

  applyThemePreference(
    isThemePreference(storedPreference) ? storedPreference : DEFAULT_THEME,
  );
};

/*
함수 이름 : syncThemeFromColorScheme
기능 : OS의 색상 모드가 바뀌면 시스템 설정을 고른 사용자의 테마를 다시 맞춘다. 특정 테마를 고른 사용자는 영향받지 않는다.
인자 : 없음
반환값 : 없음
*/
export const syncThemeFromColorScheme = (): void => {
  if (getCurrentThemePreference() === SYSTEM_THEME) {
    applyThemePreference(SYSTEM_THEME);
  }
};

/*
함수 이름 : syncThemeFromStorageEvent
기능 : 다른 탭이 테마를 바꾸면 이 탭에도 적용한다. 이벤트가 큐에 있는 동안 이 탭에서 다시 고를 수 있으므로, 이벤트의 값이 아니라 저장소의 최신 값을 따른다.
인자 : StorageEvent event -> window의 storage 이벤트
반환값 : 없음
*/
export const syncThemeFromStorageEvent = (event: StorageEvent): void => {
  const isClearAll = event.key === null; // localStorage.clear()는 key를 null로 보낸다.

  if (!isClearAll && event.key !== THEME_STORAGE_KEY) return;

  syncThemeFromStorage();
};
