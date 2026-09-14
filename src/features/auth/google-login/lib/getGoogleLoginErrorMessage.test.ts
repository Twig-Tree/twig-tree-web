import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getGoogleLoginErrorMessage } from "./getGoogleLoginErrorMessage";

// 서버가 에러 코드를 담아 응답한 실패를 만든다.
const createApiError = (status: number, code: string): AxiosError => {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError("request failed", "ERR_BAD_REQUEST", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { isSuccess: false, code, message: "", data: null },
  });
};

// 응답을 받지 못한 네트워크 오류·timeout을 만든다.
const createNetworkError = (): AxiosError => {
  return new AxiosError("Network Error", "ERR_NETWORK", {
    headers: new AxiosHeaders(),
  });
};

describe("getGoogleLoginErrorMessage", () => {
  it("응답을 받지 못하면 연결 실패를 안내한다", () => {
    expect(getGoogleLoginErrorMessage(createNetworkError())).toBe(
      "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });

  it("구글 ID 토큰이 무효면 다시 로그인하도록 안내한다", () => {
    expect(getGoogleLoginErrorMessage(createApiError(401, "AUTH401-1"))).toBe(
      "Google 인증 정보를 확인하지 못했습니다. 다시 로그인해 주세요.",
    );
  });

  it("토큰 저장소 장애면 일시적인 문제로 안내한다", () => {
    expect(getGoogleLoginErrorMessage(createApiError(503, "AUTH503-1"))).toBe(
      "로그인 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
    );
  });

  it("그 외의 실패는 일반 안내를 보여준다", () => {
    expect(getGoogleLoginErrorMessage(createApiError(500, "COMMON500"))).toBe(
      "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
});
