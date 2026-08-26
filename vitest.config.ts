// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "./vitest.setup.ts",

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
