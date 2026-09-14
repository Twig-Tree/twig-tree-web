// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "./vitest.setup.ts",

    /*
    hook과 컴포넌트를 테스트하려면 DOM이 필요하다. vitest 4에는 파일 패턴별로 환경을
    지정하는 environmentMatchGlobs가 없으므로, 순수 함수 테스트까지 포함해 전역으로 지정한다.

    test.projects로 node와 jsdom을 나눌 수도 있지만 setupFiles와 env를 양쪽에 유지해야 하고
    새 테스트마다 소속을 정해야 한다. 순수 함수 테스트의 실행 시간이 문제가 되면 그때 나눈다.
    */
    environment: "jsdom",

    /*
    shared/config의 두 모듈은 import 시점에 process.env를 읽고 값이 없으면 예외를 던진다.
    entity 공개 API를 import하면 api 모듈을 거쳐 이 둘까지 로드되므로, 값이 없으면
    테스트가 검사를 시작하기도 전에 죽는다. vitest는 .env를 process.env로 주입하지 않는다.

    각자의 .env나 셸 상태에 따라 결과가 달라지지 않도록 셸 환경을 읽지 않고 여기에 고정한다.
    msw 핸들러가 경로를 와일드카드로 받으므로 실제 주소일 필요는 없다.
    */
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost/api",
      NEXT_PUBLIC_AUTH_MODE: "optional",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
