import { describe, it, expect } from "vitest";
import { MAX_MEMO_LENGTH } from "@/src/entities/tree/model/constants";
import { validateMemoContent } from "./validateMemoContent";

describe("validateMemoContent", () => {
  it("일반적인 내용은 통과시킨다", () => {
    expect(validateMemoContent("바로크 시대 특징 정리")).toBeNull();
  });

  /*
  빈 메모 저장은 메모 삭제로 처리하므로 검증에서 막으면 안 된다.
  */
  it("빈 내용을 통과시킨다", () => {
    expect(validateMemoContent("")).toBeNull();
    expect(validateMemoContent("   ")).toBeNull();
  });

  it("500자까지는 통과시킨다", () => {
    expect(validateMemoContent("가".repeat(MAX_MEMO_LENGTH))).toBeNull();
  });

  it("500자를 초과하면 거부한다", () => {
    expect(validateMemoContent("가".repeat(MAX_MEMO_LENGTH + 1))).toBe(
      "메모 내용은 최대 500자까지 입력할 수 있습니다.",
    );
  });

  it("앞뒤 공백을 제거한 뒤 길이를 판단한다", () => {
    expect(
      validateMemoContent(`  ${"가".repeat(MAX_MEMO_LENGTH)}  `),
    ).toBeNull();
  });

  it("한글과 영문을 같은 글자 수로 센다", () => {
    expect(validateMemoContent("가".repeat(MAX_MEMO_LENGTH))).toBeNull();
    expect(validateMemoContent("a".repeat(MAX_MEMO_LENGTH))).toBeNull();
  });
});
