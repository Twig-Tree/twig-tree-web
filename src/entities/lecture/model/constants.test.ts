import { describe, expect, it } from "vitest";
import {
  LECTURE_GENERATION_REQUEST,
  MAX_LECTURE_REQUEST_LENGTH,
} from "./constants";

describe("LECTURE_GENERATION_REQUEST", () => {
  /*
  백엔드는 비었거나 상한을 넘는 request를 400으로 거절한다.
  */
  it("백엔드가 받는 길이 안에 있다", () => {
    expect(LECTURE_GENERATION_REQUEST.trim()).not.toBe("");
    expect(LECTURE_GENERATION_REQUEST.length).toBeLessThanOrEqual(
      MAX_LECTURE_REQUEST_LENGTH,
    );
  });
});
