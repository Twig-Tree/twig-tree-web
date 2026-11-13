import { describe, expect, it } from "vitest";
import { MAX_LECTURE_TREE_OUTLINE_LENGTH } from "@/src/entities/lecture";
import { validateLectureTreeOutline } from "./validateLectureGeneration";

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
