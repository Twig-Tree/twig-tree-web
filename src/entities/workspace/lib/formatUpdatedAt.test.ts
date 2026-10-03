import { describe, it, expect } from "vitest";
import { formatUpdatedAt } from "./formatUpdatedAt";

/*
vitest.config.ts가 TZ를 Asia/Seoul로 고정하므로 UTC 입력은 9시간 뒤로 표시된다.
*/
describe("formatUpdatedAt", () => {
  it("UTC 시각을 사용자 시간대의 날짜와 시각으로 변환한다", () => {
    expect(formatUpdatedAt("2026-08-31T12:00:00Z")).toBe("2026-08-31 21:00");
  });

  it("조회 응답의 마이크로초 6자리를 분까지만 남긴다", () => {
    expect(formatUpdatedAt("2026-10-02T07:25:01.329937Z")).toBe(
      "2026-10-02 16:25",
    );
  });

  it("수정 응답의 나노초 9자리도 해석한다", () => {
    expect(formatUpdatedAt("2026-10-03T07:10:15.471525587Z")).toBe(
      "2026-10-03 16:10",
    );
  });

  it("시간대 변환으로 날짜가 넘어가면 다음 날로 표시한다", () => {
    expect(formatUpdatedAt("2026-08-31T15:30:00Z")).toBe("2026-09-01 00:30");
  });

  it("UTC가 아닌 오프셋도 반영한다", () => {
    expect(formatUpdatedAt("2026-08-31T21:00:00+09:00")).toBe(
      "2026-08-31 21:00",
    );
  });

  it("한 자리 월·일·시·분에 0을 채운다", () => {
    expect(formatUpdatedAt("2026-01-05T00:07:00Z")).toBe("2026-01-05 09:07");
  });

  it("해석할 수 없는 값은 null로 처리한다", () => {
    expect(formatUpdatedAt("")).toBeNull();
    expect(formatUpdatedAt("어제")).toBeNull();
  });
});
