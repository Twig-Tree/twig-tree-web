import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/src/tests/mocks/server";

/*
jsdom은 dialog의 showModal과 close를 구현하지 않는다. Modal이 열림 상태를 이 두 메서드로
옮기므로, 없으면 모달을 쓰는 컴포넌트 테스트가 렌더 시점에 죽는다.

open 속성만 맞춰 주면 children이 표시되어 내용은 검사할 수 있다. top layer와 포커스 가둠은
브라우저가 하는 일이라 여기서 흉내 내지 않고 브라우저에서 확인한다.
*/
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.open = true;
  };
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers());

/*
render한 DOM은 테스트마다 지워야 한다. 남아 있으면 다음 테스트의 screen 쿼리가
이전 테스트의 요소까지 찾아 실패한다.

Testing Library는 전역 afterEach가 있을 때만 이 정리를 스스로 등록한다.
지금은 globals: true라 등록되지만 그 설정을 끄면 조용히 멈추고, 그때 나는 실패는
설정을 바꾼 탓으로 보이지 않는다. 그래서 자동 등록에 기대지 않고 직접 등록한다.
*/
afterEach(() => cleanup());
