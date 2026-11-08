import { describe, expect, it } from "vitest";
import {
  MAX_LECTURE_REQUEST_LENGTH,
  MAX_LECTURE_TREE_OUTLINE_LENGTH,
} from "@/src/entities/lecture";
import {
  validateLectureRequest,
  validateLectureTreeOutline,
} from "./validateLectureGeneration";

describe("validateLectureRequest", () => {
  it("앞뒤 공백을 뺀 길이로 상한을 검사한다", () => {
    const maxRequest = "가".repeat(MAX_LECTURE_REQUEST_LENGTH);

    expect(validateLectureRequest(`  ${maxRequest}  `)).toBeNull();
    expect(validateLectureRequest(`${maxRequest}가`)).toBe(
      `강의 요청은 최대 ${MAX_LECTURE_REQUEST_LENGTH}자까지 입력할 수 있습니다.`,
    );
  });

  it("공백만 있으면 거부한다", () => {
    expect(validateLectureRequest(" \n ")).toBe(
      "어떤 강의를 원하는지 입력해 주세요.",
    );
  });
});

describe("validateLectureTreeOutline", () => {
  it("비었거나 상한을 넘으면 거부한다", () => {
    expect(validateLectureTreeOutline("")).not.toBeNull();
    expect(
      validateLectureTreeOutline("a".repeat(MAX_LECTURE_TREE_OUTLINE_LENGTH)),
    ).toBeNull();
    expect(
      validateLectureTreeOutline(
        "a".repeat(MAX_LECTURE_TREE_OUTLINE_LENGTH + 1),
      ),
    ).toBe("트리가 너무 커서 강의를 만들 수 없습니다.");
  });
});
