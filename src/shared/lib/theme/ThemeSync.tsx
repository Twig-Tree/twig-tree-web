"use client";

import { useEffect } from "react";
import { syncThemeFromStorageEvent } from "./themeStore";

/*
함수 이름 : ThemeSync
기능 : 다른 탭의 테마 변경을 받아 이 탭에 적용한다. 선택 UI가 없는 로그인 화면에서도 동작하도록 루트 레이아웃에 둔다.
인자 : 없음
반환값 : 화면에 그리는 내용 없음
*/
export function ThemeSync() {
  useEffect(() => {
    window.addEventListener("storage", syncThemeFromStorageEvent);

    return () =>
      window.removeEventListener("storage", syncThemeFromStorageEvent);
  }, []);

  return null;
}
