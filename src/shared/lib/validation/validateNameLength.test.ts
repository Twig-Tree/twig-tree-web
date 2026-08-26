import { describe, it, expect } from "vitest";
import { validateNameLength } from "./validateNameLength";

const MAX_LENGTH = 30; // 도메인 상한과 무관하게 검사 규칙만 확인하기 위한 값이다.

const validate = (name: string, label = "노드") =>
  validateNameLength(name, label, MAX_LENGTH);

describe("validateNameLength", () => {
  it("일반적인 이름은 통과시킨다", () => {
    expect(validate("고전 음악")).toBeNull();
  });

  it("빈 문자열을 거부한다", () => {
    expect(validate("")).toBe("노드 이름을 입력해 주세요.");
  });

  it("공백만 있는 입력을 거부한다", () => {
    expect(validate("   ")).toBe("노드 이름을 입력해 주세요.");
  });

  it("안내 문구에 넘긴 label을 사용한다", () => {
    expect(validate("", "폴더")).toBe("폴더 이름을 입력해 주세요.");
    expect(validate("가".repeat(MAX_LENGTH + 1), "폴더")).toBe(
      "폴더 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });

  it("안내 문구에 넘긴 상한값을 사용한다", () => {
    expect(validateNameLength("가".repeat(51), "워크스페이스", 50)).toBe(
      "워크스페이스 이름은 최대 50자까지 입력할 수 있습니다.",
    );
  });

  it("앞뒤 공백을 제거한 뒤 길이를 판단한다", () => {
    expect(validate(`  ${"가".repeat(MAX_LENGTH)}  `)).toBeNull();
  });

  it("상한과 같은 길이까지는 통과시킨다", () => {
    expect(validate("가".repeat(MAX_LENGTH))).toBeNull();
  });

  it("상한을 초과하면 거부한다", () => {
    expect(validate("가".repeat(MAX_LENGTH + 1))).toBe(
      "노드 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });

  /*
  한글 30자는 UTF-8로 90바이트라 바이트 기준이었다면 걸렸을 입력이다.
  한영 동일 글자 수 정책이 지켜지는지 확인한다.
  */
  it("한글과 영문을 같은 글자 수로 센다", () => {
    expect(validate("가".repeat(MAX_LENGTH))).toBeNull();
    expect(validate("a".repeat(MAX_LENGTH))).toBeNull();
  });

  /*
  백엔드의 Java String.length()는 UTF-16 코드 단위를 세므로 이모지 하나가 2자로 계산된다.
  JavaScript의 String.length도 같은 단위라 서버와 판정이 일치한다.
  */
  it("이모지를 UTF-16 코드 단위로 세어 서버와 판정을 맞춘다", () => {
    expect(validate("🌳".repeat(15))).toBeNull();
    expect(validate("🌳".repeat(16))).toBe(
      "노드 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });
});
