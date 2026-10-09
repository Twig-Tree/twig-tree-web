import { act } from "@testing-library/react";
import { vi } from "vitest";

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  elements: Element[];
  isDisconnected: boolean;
};

/*
함수 이름 : mockIntersectionObserver
기능 : jsdom에 없는 IntersectionObserver를 테스트용으로 대체하고, 교차 상태를 직접 알리는 함수를 만든다.
인자 : 없음
반환값 : notifyIntersection -> 연결이 끊기지 않은 모든 observer에 감지 중인 요소의 교차 여부를 알리는 함수

테스트마다 beforeEach에서 부르고 afterEach에서 vi.unstubAllGlobals로 되돌린다.
실제 화면 위치를 계산하지 않으므로, 보이는지는 테스트가 notifyIntersection으로 정한다.
*/
export const mockIntersectionObserver = () => {
  const observers: ObserverRecord[] = [];

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      private record: ObserverRecord;

      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback, elements: [], isDisconnected: false };
        observers.push(this.record);
      }

      observe(element: Element) {
        this.record.elements.push(element);
      }

      disconnect() {
        this.record.isDisconnected = true;
      }
    },
  );

  const notifyIntersection = (isIntersecting: boolean) => {
    act(() => {
      for (const observer of observers) {
        if (observer.isDisconnected) continue;

        observer.callback(
          observer.elements.map(
            (target) =>
              ({ target, isIntersecting }) as IntersectionObserverEntry,
          ),
          {} as IntersectionObserver,
        );
      }
    });
  };

  return { notifyIntersection };
};
