"use client";

import { useSyncExternalStore } from "react";
import {
  getCurrentTheme,
  getServerTheme,
  setTheme,
  subscribeTheme,
} from "./themeStore";

/*
함수 이름 : useTheme
기능 : 현재 테마를 구독하고 테마를 바꾸는 함수를 함께 돌려준다.
인자 : 없음
반환값 : 현재 테마와 테마 변경 함수
*/
export const useTheme = () => {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getCurrentTheme,
    getServerTheme,
  );

  return { theme, setTheme };
};
