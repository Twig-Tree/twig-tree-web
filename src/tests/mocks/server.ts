import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/*
테스트 파일이 server.use로 특정 테스트의 응답만 바꿀 수 있도록 setup 파일 밖에서 만든다.
바꾼 응답은 vitest.setup.ts의 afterEach에서 resetHandlers로 기본 핸들러로 돌아간다.
*/
export const server = setupServer(...handlers);
