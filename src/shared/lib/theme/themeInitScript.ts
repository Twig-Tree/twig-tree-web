import {
  DARK_COLOR_SCHEME_QUERY,
  SYSTEM_DARK_THEME,
  SYSTEM_LIGHT_THEME,
  SYSTEM_THEME,
  THEME_IDS,
  THEME_STORAGE_KEY,
} from "./themes";

/*
함수 이름 : getThemeInitScript
기능 : 첫 페인트 전에 저장된 테마를 문서에 적용하는 인라인 스크립트를 만든다. 서버는 저장값을 모르므로 이 스크립트가 없으면 다른 테마를 고른 사용자에게 기본 테마가 잠깐 보인다.
시스템 설정을 골랐으면 OS의 색상 모드에 맞는 테마를 적용한다. 저장소나 색상 모드를 읽을 수 없으면 서버가 그린 기본 테마를 유지한다.
인자 : 없음
반환값 : script 태그에 넣을 JavaScript 문자열
*/
export const getThemeInitScript = (): string =>
  `try{var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}),s=p===${JSON.stringify(SYSTEM_THEME)},t=s?matchMedia(${JSON.stringify(DARK_COLOR_SCHEME_QUERY)}).matches?${JSON.stringify(SYSTEM_DARK_THEME)}:${JSON.stringify(SYSTEM_LIGHT_THEME)}:p,d=document.documentElement.dataset;if(${JSON.stringify(THEME_IDS)}.indexOf(t)!==-1){d.theme=t;if(s)d.themePreference=p}}catch(e){}`;
