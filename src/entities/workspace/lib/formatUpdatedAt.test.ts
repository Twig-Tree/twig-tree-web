import { describe, it, expect } from "vitest";
import { formatUpdatedAt } from "./formatUpdatedAt";

describe("formatUpdatedAt", () => {
  it("서버가 주는 오프셋 없는 형식을 날짜와 시각으로 변환한다", () => {
    expect(formatUpdatedAt("2026-08-31T21:00:00")).toBe("2026-08-31 21:00");
  });

  it("밀리초가 붙어도 분까지만 남긴다", () => {
    expect(formatUpdatedAt("2026-08-31T21:00:00.123")).toBe("2026-08-31 21:00");
  });

  it("한 자리 월·일·시·분에 0을 채운다", () => {
    expect(formatUpdatedAt("2026-01-05T09:07:00")).toBe("2026-01-05 09:07");
  });

  /*
  오프셋이 붙은 값은 결과가 실행 환경의 시간대에 따라 달라지므로 표시 값을 단정하지 않고,
  변환이 실패하지 않는 것만 확인한다.
  */
  it("오프셋이 붙은 값도 해석한다", () => {
    expect(formatUpdatedAt("2026-08-31T21:00:00+09:00")).not.toBeNull();
  });

  it("해석할 수 없는 값은 null로 처리한다", () => {
    expect(formatUpdatedAt("")).toBeNull();
    expect(formatUpdatedAt("어제")).toBeNull();
  });
});
