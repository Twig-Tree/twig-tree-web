import { describe, it, expect } from "vitest";
import { MAX_NAME_LENGTH } from "@/src/shared/lib/validation/validateNameLength";
import { validateNodeName } from "./validateNodeName";

/*
길이 판정의 경계와 이모지 처리는 validateNameLength가 소유한다.
여기서는 노드 이름이 그 정책을 "노드" 안내 문구로 사용하는지만 확인한다.
*/
describe("validateNodeName", () => {
  it("일반적인 이름은 통과시킨다", () => {
    expect(validateNodeName("고전 음악")).toBeNull();
  });

  it("빈 입력을 노드 안내 문구로 거부한다", () => {
    expect(validateNodeName("   ")).toBe("노드 이름을 입력해 주세요.");
  });

  it("30자까지는 통과시킨다", () => {
    expect(validateNodeName("가".repeat(MAX_NAME_LENGTH))).toBeNull();
  });

  it("30자를 초과하면 노드 안내 문구로 거부한다", () => {
    expect(validateNodeName("가".repeat(MAX_NAME_LENGTH + 1))).toBe(
      "노드 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });
});
