"use client";

import { useCallback, useEffect, useRef } from "react";

/*
함수 이름 : useIsMounted
기능 : 컴포넌트가 아직 화면에 있는지 확인하는 함수를 만든다.
인자 : 없음
반환값 : mount 상태면 true를 돌려주는 함수

비동기 요청을 기다리는 동안 컴포넌트가 사라질 수 있는 곳에서 쓴다. 요청은 unmount 후에도 끝나므로,
그 결과로 부모의 callback을 부르면 이미 다른 화면 상태를 건드리게 된다.

React 18 StrictMode는 effect를 두 번 실행하므로 cleanup에서 false로 둔 값을 다시 true로 되돌린다.
*/
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}
