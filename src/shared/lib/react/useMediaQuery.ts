"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
함수 이름 : useMediaQuery
기능 : CSS 미디어 쿼리가 지금 일치하는지 구독한다. 화면 크기가 바뀌어 결과가 달라지면 다시 그린다.
인자 : string query -> 검사할 미디어 쿼리. 예: "(max-width: 1023px)"
반환값 : 일치하면 true

서버에는 화면이 없으므로 서버 렌더와 hydration에서는 false로 보고, hydration 뒤에 실제 값으로 다시 그린다.
*/
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);

      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
