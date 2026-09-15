import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { isClientError } from "./httpErrors";

const createApiError = (status: number): AxiosError => {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError("request failed", "ERR_BAD_REQUEST", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data: {},
  });
};

describe("isClientError", () => {
  it("4xx 응답이면 true를 반환한다", () => {
    expect(isClientError(createApiError(400))).toBe(true);
    expect(isClientError(createApiError(403))).toBe(true);
    expect(isClientError(createApiError(404))).toBe(true);
    expect(isClientError(createApiError(499))).toBe(true);
  });

  it("5xx 응답이면 false를 반환한다", () => {
    expect(isClientError(createApiError(500))).toBe(false);
  });

  it("응답이 없는 네트워크 오류는 false를 반환한다", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK", {
      headers: new AxiosHeaders(),
    });

    expect(isClientError(error)).toBe(false);
  });

  it("axios 오류가 아니면 false를 반환한다", () => {
    expect(isClientError(new Error("boom"))).toBe(false);
  });
});
