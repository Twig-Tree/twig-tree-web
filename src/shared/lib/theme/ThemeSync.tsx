"use client";

import { useEffect } from "react";
import {
  syncThemeFromColorScheme,
  syncThemeFromStorage,
  syncThemeFromStorageEvent,
} from "./themeStore";
import { DARK_COLOR_SCHEME_QUERY } from "./themes";

/*
함수 이름 : ThemeSync
기능 : 다른 탭의 테마 변경과 OS의 색상 모드 변경을 받아 이 탭에 적용한다. 선택 UI가 없는 로그인 화면에서도 동작하도록 루트 레이아웃에 둔다.
인자 : 없음
반환값 : 화면에 그리는 내용 없음
*/
export function ThemeSync() {
  useEffect(() => {
    const colorSchemeQuery = window.matchMedia?.(DARK_COLOR_SCHEME_QUERY);

    window.addEventListener("storage", syncThemeFromStorageEvent);
    colorSchemeQuery?.addEventListener("change", syncThemeFromColorScheme);

    /*
    초기 스크립트가 돈 뒤 구독을 시작하기 전까지 다른 탭이 바꾼 값은 이벤트로 받지 못하므로 한 번 맞춘다.
    */
    syncThemeFromStorage();

    return () => {
      window.removeEventListener("storage", syncThemeFromStorageEvent);
      colorSchemeQuery?.removeEventListener("change", syncThemeFromColorScheme);
    };
  }, []);

  return null;
}
