import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/src/tests/mocks/handlers";

const server = setupServer(...handlers);

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
