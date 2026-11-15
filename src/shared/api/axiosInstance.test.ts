import { afterEach, describe, it, expect, vi } from "vitest";
import { axiosInstance } from "./axiosInstance";
import { isRequestTimeout } from "./httpErrors";

/*
보내자마자 브라우저의 timeout 또는 중단 이벤트를 일으키는 XMLHttpRequest.
msw는 XMLHttpRequest의 timeout을 흉내 내지 않아 응답을 늦춰도 timeout이 아니라 네트워크 오류가 되므로 직접 만든다.
*/
const createFakeXMLHttpRequest = (event: "ontimeout" | "onabort") =>
  class FakeXMLHttpRequest {
    ontimeout: (() => void) | null = null;
    onabort: (() => void) | null = null;
    onloadend: (() => void) | null = null;
    timeout = 0;
    withCredentials = false;
    responseType = "";
    open() {}
    setRequestHeader() {}
    getAllResponseHeaders() {
      return "";
    }
    abort() {}
    send() {
      setTimeout(() => this[event]?.());
    }
  };

describe("axiosInstance", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /*
  isRequestTimeout은 timeout이 ETIMEDOUT으로 온다는 데 기댄다. xhr 어댑터는 transitional 설정이 있어야 그렇게 알리므로,
  설정이 빠지면 판정 함수 테스트는 통과한 채 실제 timeout이 브라우저 중단처럼 보이게 된다.
  */
  it("timeout으로 끊은 요청은 isRequestTimeout으로 판정된다", async () => {
    vi.stubGlobal("XMLHttpRequest", createFakeXMLHttpRequest("ontimeout"));

    const error = await axiosInstance
      .get("/slow")
      .catch((reason: unknown) => reason);

    expect(isRequestTimeout(error)).toBe(true);
  });

  it("브라우저가 중단한 요청은 isRequestTimeout으로 판정되지 않는다", async () => {
    vi.stubGlobal("XMLHttpRequest", createFakeXMLHttpRequest("onabort"));

    const error = await axiosInstance
      .get("/slow")
      .catch((reason: unknown) => reason);

    expect(isRequestTimeout(error)).toBe(false);
  });
});
