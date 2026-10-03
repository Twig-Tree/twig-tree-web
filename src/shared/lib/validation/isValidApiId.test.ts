import { describe, it, expect } from "vitest";
import { isValidApiId } from "./isValidApiId";

describe("isValidApiId", () => {
  it("양의 정수 문자열을 통과시킨다", () => {
    expect(isValidApiId("1")).toBe(true);
    expect(isValidApiId("12")).toBe(true);
  });

  it("안전정수 상한까지는 통과시킨다", () => {
    expect(isValidApiId(String(Number.MAX_SAFE_INTEGER))).toBe(true);
  });

  it("안전정수 범위를 넘으면 거부한다", () => {
    expect(isValidApiId("9007199254740993")).toBe(false);
  });

  it("빈 문자열과 숫자가 아닌 문자열을 거부한다", () => {
    expect(isValidApiId("")).toBe(false);
    expect(isValidApiId("abc")).toBe(false);
    expect(isValidApiId("NaN")).toBe(false);
  });

  it("0과 음수를 거부한다", () => {
    expect(isValidApiId("0")).toBe(false);
    expect(isValidApiId("-1")).toBe(false);
  });

  it("소수를 거부한다", () => {
    expect(isValidApiId("1.5")).toBe(false);
    expect(isValidApiId("1.0")).toBe(false);
  });

  /*
  Number()는 아래 표기를 모두 정수로 읽는다. 통과시키면 URL과 다른 ID로 요청이 나가고
  같은 리소스가 다른 query key로 캐시에 갈린다.
  */
  it("Number()가 정수로 읽는 비정규 표기를 거부한다", () => {
    expect(isValidApiId("1e3")).toBe(false);
    expect(isValidApiId("0x10")).toBe(false);
    expect(isValidApiId("012")).toBe(false);
    expect(isValidApiId(" 12")).toBe(false);
    expect(isValidApiId("12 ")).toBe(false);
    expect(isValidApiId("+12")).toBe(false);
  });
});
