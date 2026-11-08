"use client";

import { useSyncExternalStore } from "react";
import {
  getCurrentTheme,
  getCurrentThemePreference,
  getServerTheme,
  getServerThemePreference,
  setTheme,
  subscribeTheme,
} from "./themeStore";

/*
함수 이름 : useTheme
기능 : 적용된 테마와 사용자가 고른 값을 구독하고, 고른 값을 바꾸는 함수를 함께 돌려준다.
인자 : 없음
반환값 : 적용된 테마, 사용자가 고른 값, 변경 함수
*/
export const useTheme = () => {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getCurrentTheme,
    getServerTheme,
  );

  const preference = useSyncExternalStore(
    subscribeTheme,
    getCurrentThemePreference,
    getServerThemePreference,
  );

  return { theme, preference, setTheme };
};
