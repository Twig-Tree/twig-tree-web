import { server } from "@/src/tests/mocks/server";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 테스트마다 새로 불러온 모듈을 담는다. 아래 beforeEach 주석 참고.
let restoreSession: typeof import("./restoreSession").restoreSession;
let markSessionEnded: typeof import("./restoreSession").markSessionEnded;
let authSession: typeof import("@/src/shared/lib/auth/authSession").authSession;

// 재발급 요청이 서버에 몇 번 도착했는지 센다.
let refreshRequestCount = 0;

/*
함수 이름 : mockRefreshResponse
기능 : /auth/refresh 요청이 돌려줄 응답을 이 테스트에서만 정하고, 도착한 요청 수를 센다.
인자 : () => Response createResponse -> 요청마다 돌려줄 응답을 만드는 함수
반환값 : 없음
*/
const mockRefreshResponse = (createResponse: () => Response) => {
  server.use(
    http.post("*/auth/refresh", () => {
      refreshRequestCount += 1;
      return createResponse();
    }),
  );
};

// 백엔드 응답 봉투 모양으로 실패 응답을 만든다.
const createErrorResponse = (status: number, code: string) =>
  HttpResponse.json(
    { isSuccess: false, code, message: "error", data: null },
    { status },
  );

const refreshSuccess = () =>
  HttpResponse.json({
    isSuccess: true,
    code: "COMMON200",
    message: "success",
    data: { accessToken: "new-access-token" },
  });

/*
restoreSession은 "세션이 없다고 확인했다"는 기록을 모듈 변수에 남긴다.
테스트끼리 그 기록이 섞이지 않도록 모듈을 매번 새로 불러온다.
*/
beforeEach(async () => {
  vi.resetModules();
  refreshRequestCount = 0;

  ({ restoreSession, markSessionEnded } = await import("./restoreSession"));
  ({ authSession } = await import("@/src/shared/lib/auth/authSession"));
});

afterEach(() => {
  sessionStorage.clear();
});

describe("restoreSession", () => {
  it("access token이 이미 있으면 재발급하지 않고 restored", async () => {
    mockRefreshResponse(refreshSuccess);
    authSession.setTokens({ accessToken: "saved-access-token" });

    await expect(restoreSession()).resolves.toBe("restored");
    expect(refreshRequestCount).toBe(0);
  });

  it("재발급에 성공하면 토큰을 저장하고 restored", async () => {
    mockRefreshResponse(refreshSuccess);

    await expect(restoreSession()).resolves.toBe("restored");
    expect(authSession.getAccessToken()).toBe("new-access-token");
  });

  it("refresh token이 만료되면 unauthenticated이고, 다시 호출해도 재발급하지 않는다", async () => {
    mockRefreshResponse(() => createErrorResponse(401, "AUTH401-5"));

    await expect(restoreSession()).resolves.toBe("unauthenticated");
    await expect(restoreSession()).resolves.toBe("unauthenticated");
    expect(refreshRequestCount).toBe(1);
  });

  it("토큰 저장소 장애면 failed이고, 다시 호출하면 재발급을 다시 보낸다", async () => {
    mockRefreshResponse(() => createErrorResponse(503, "AUTH503-1"));

    await expect(restoreSession()).resolves.toBe("failed");
    await expect(restoreSession()).resolves.toBe("failed");
    expect(refreshRequestCount).toBe(2);
  });

  it("네트워크 오류면 failed", async () => {
    mockRefreshResponse(() => HttpResponse.error());

    await expect(restoreSession()).resolves.toBe("failed");
    expect(authSession.getAccessToken()).toBeNull();
  });

  /*
  로그아웃의 서버 폐기가 실패해 쿠키가 살아 있는 상황이다.
  재발급이 성공하는 서버에서도 복구하지 않아야 로그아웃이 되돌려지지 않는다.
  */
  it("세션을 끝냈다고 기록하면 재발급이 가능해도 요청하지 않고 unauthenticated", async () => {
    mockRefreshResponse(refreshSuccess);
    markSessionEnded();

    await expect(restoreSession()).resolves.toBe("unauthenticated");
    expect(refreshRequestCount).toBe(0);
  });

  it("동시에 여러 번 호출해도 재발급은 한 번만 보낸다", async () => {
    mockRefreshResponse(refreshSuccess);

    const results = await Promise.all([restoreSession(), restoreSession()]);

    expect(results).toEqual(["restored", "restored"]);
    expect(refreshRequestCount).toBe(1);
  });
});
