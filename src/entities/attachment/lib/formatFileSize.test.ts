import { describe, it, expect } from "vitest";
import { formatFileSize } from "./formatFileSize";

describe("formatFileSize", () => {
  it("바이트 단위 크기는 소수점 없이 표시한다", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("단위가 바뀌는 경계에서 다음 단위로 표시한다", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1024 ** 2)).toBe("1 MB");
    expect(formatFileSize(1024 ** 3)).toBe("1 GB");
  });

  it("소수점 첫째 자리까지만 표시한다", () => {
    expect(formatFileSize(2516582)).toBe("2.4 MB");
  });

  it("나누어떨어지는 값에는 의미 없는 0을 붙이지 않는다", () => {
    expect(formatFileSize(1024 * 50)).toBe("50 KB");
  });

  it("크기를 알 수 없거나 유효하지 않은 값은 0 B로 처리한다", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(-5)).toBe("0 B");
    expect(formatFileSize(Number.NaN)).toBe("0 B");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("0 B");
  });

  it("단위 목록을 넘어서는 크기는 마지막 단위로 고정한다", () => {
    expect(formatFileSize(1024 ** 5)).toBe("1024 TB");
  });
});
