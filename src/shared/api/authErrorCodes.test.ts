import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import {
  AUTH_ERROR_CODE,
  getApiErrorCode,
  isReissuableError,
  isSessionEndingError,
} from "./authErrorCodes";

// 백엔드는 성공과 실패에 같은 응답 봉투를 쓴다.
const createApiError = (status: number, code: string | null): AxiosError => {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError("request failed", "ERR_BAD_REQUEST", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data:
      code === null ? {} : { isSuccess: false, code, message: "", data: null },
  });
};

// 응답을 받지 못한 네트워크 오류·타임아웃.
const createNetworkError = (): AxiosError => {
  return new AxiosError("Network Error", "ERR_NETWORK", {
    headers: new AxiosHeaders(),
  });
};

describe("getApiErrorCode", () => {
  it("응답 봉투에서 에러 코드를 꺼낸다", () => {
    expect(getApiErrorCode(createApiError(401, "AUTH401-4"))).toBe("AUTH401-4");
  });

  it("axios 오류가 아니면 null을 반환한다", () => {
    expect(getApiErrorCode(new Error("boom"))).toBeNull();
  });

  it("응답이 없는 네트워크 오류에는 null을 반환한다", () => {
    expect(getApiErrorCode(createNetworkError())).toBeNull();
  });

  it("본문에 code가 없으면 null을 반환한다", () => {
    expect(getApiErrorCode(createApiError(401, null))).toBeNull();
  });
});

describe("isReissuableError", () => {
  it("access token 만료만 재발급 대상으로 판정한다", () => {
    expect(
      isReissuableError(
        createApiError(401, AUTH_ERROR_CODE.EXPIRED_ACCESS_TOKEN),
      ),
    ).toBe(true);
  });

  it("access token 위조는 재발급 대상이 아니다", () => {
    expect(isReissuableError(createApiError(401, "AUTH401-3"))).toBe(false);
  });

  it("refresh token 재사용 탐지는 재발급 대상이 아니다", () => {
    expect(isReissuableError(createApiError(401, "AUTH401-4"))).toBe(false);
  });
});

describe("isSessionEndingError", () => {
  it.each(["AUTH401-3", "AUTH401-4", "AUTH401-5", "COMMON401-1"])(
    "복구할 수 없는 401 %s 은 세션을 끝낸다",
    (code) => {
      expect(isSessionEndingError(createApiError(401, code))).toBe(true);
    },
  );

  it("코드를 읽을 수 없는 401도 세션을 끝낸다", () => {
    expect(isSessionEndingError(createApiError(401, null))).toBe(true);
  });

  it("access token 만료는 재발급으로 복구하므로 세션을 끝내지 않는다", () => {
    expect(
      isSessionEndingError(
        createApiError(401, AUTH_ERROR_CODE.EXPIRED_ACCESS_TOKEN),
      ),
    ).toBe(false);
  });

  /*
  저장소 장애를 세션 종료로 처리하면 Redis가 잠깐 흔들릴 때 전 사용자가 로그인 화면으로 튕긴다.
  현재 백엔드는 503으로 내려주지만, 상태 코드가 아니라 에러 코드로도 걸러지는지 함께 확인한다.
  */
  it.each([503, 401])(
    "토큰 저장소 장애는 상태 코드가 %i 여도 세션을 끝내지 않는다",
    (status) => {
      expect(
        isSessionEndingError(
          createApiError(status, AUTH_ERROR_CODE.TOKEN_STORE_UNAVAILABLE),
        ),
      ).toBe(false);
    },
  );

  it("네트워크 오류는 세션을 끝내지 않는다", () => {
    expect(isSessionEndingError(createNetworkError())).toBe(false);
  });

  it("401이 아닌 오류는 세션을 끝내지 않는다", () => {
    expect(isSessionEndingError(createApiError(500, "COMMON500-1"))).toBe(
      false,
    );
  });
});
