"use client";

import { useEffect, useEffectEvent, useState } from "react";

/*
함수 이름 : useOnVisible
기능 : 요소가 화면에 들어올 때마다 callback을 부르는 callback ref를 만든다.
인자 : () => void onVisible -> 요소가 화면에 들어왔을 때 부를 함수
반환값 : 감지할 요소의 ref prop에 넘길 callback ref

root는 뷰포트다. 요소가 스크롤 컨테이너 밖으로 잘리면 뷰포트 기준으로도 보이지 않는 것으로 계산되므로,
컨테이너 안에서 스크롤해도 동작한다.

observer는 요소가 바뀔 때마다 새로 붙인다. 새 observer는 붙는 순간의 상태로 callback을 한 번 부르므로,
감지 요소를 조건부로 다시 그리면 이미 보이는 상태에서도 다시 알림을 받는다.
*/
export function useOnVisible<T extends Element>(
  onVisible: () => void,
): (element: T | null) => void {
  const [element, setElement] = useState<T | null>(null);

  /*
  매 렌더마다 바뀌는 callback 때문에 observer를 다시 붙이지 않도록, 알림 시점의 최신 callback을 읽는다.
  */
  const handleVisible = useEffectEvent(onVisible);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) handleVisible();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return setElement;
}
