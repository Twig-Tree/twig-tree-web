import { THEME_IDS, THEME_STORAGE_KEY } from "./themes";

/*
함수 이름 : getThemeInitScript
기능 : 첫 페인트 전에 저장된 테마를 문서에 적용하는 인라인 스크립트를 만든다. 서버는 저장값을 모르므로 이 스크립트가 없으면 다른 테마를 고른 사용자에게 기본 테마가 잠깐 보인다.
저장소를 읽을 수 없으면 서버가 그린 기본 테마를 유지한다.
인자 : 없음
반환값 : script 태그에 넣을 JavaScript 문자열
*/
export const getThemeInitScript = (): string =>
  `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(THEME_IDS)}.indexOf(t)!==-1)document.documentElement.dataset.theme=t}catch(e){}`;
