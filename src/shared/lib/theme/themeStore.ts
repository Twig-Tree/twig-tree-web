import {
  DEFAULT_THEME,
  isThemeId,
  THEME_STORAGE_KEY,
  type ThemeId,
} from "./themes";

const THEME_CHANGE_EVENT = "twig-tree:theme-change";

/*
함수 이름 : applyTheme
기능 : 문서의 테마를 바꾸고 구독자에게 알린다. 화면의 CSS가 읽는 data-theme을 현재 테마의 단일 원본으로 둔다.
인자 : ThemeId themeId -> 적용할 테마
반환값 : 없음
*/
const applyTheme = (themeId: ThemeId): void => {
  document.documentElement.dataset.theme = themeId;
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
함수 이름 : setTheme
기능 : 테마를 적용하고 저장한다. 저장소를 쓸 수 없는 환경에서도 지금 화면에는 적용한다.
나중에 계정 저장을 붙일 때 저장 위치를 바꾸는 곳이 여기다.
인자 : ThemeId themeId -> 사용자가 고른 테마
반환값 : 없음
*/
export const setTheme = (themeId: ThemeId): void => {
  applyTheme(themeId);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
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
함수 이름 : syncThemeFromStorageEvent
기능 : 다른 탭이 테마를 바꾸면 이 탭에도 적용한다. 저장값이 지워졌거나 제품에 없는 테마면 기본 테마로 돌아간다.
인자 : StorageEvent event -> window의 storage 이벤트
반환값 : 없음
*/
export const syncThemeFromStorageEvent = (event: StorageEvent): void => {
  const isClearAll = event.key === null; // localStorage.clear()는 key를 null로 보낸다.

  if (!isClearAll && event.key !== THEME_STORAGE_KEY) return;

  applyTheme(isThemeId(event.newValue) ? event.newValue : DEFAULT_THEME);
};
