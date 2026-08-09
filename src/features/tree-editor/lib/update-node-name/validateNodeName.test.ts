import { describe, it, expect } from "vitest";
import { MAX_NODE_NAME_LENGTH, validateNodeName } from "./validateNodeName";

describe("validateNodeName", () => {
  it("일반적인 이름은 통과시킨다", () => {
    expect(validateNodeName("고전 음악")).toBeNull();
  });

  it("빈 문자열을 거부한다", () => {
    expect(validateNodeName("")).toBe("노드 이름을 입력해 주세요.");
  });

  it("공백만 있는 입력을 거부한다", () => {
    expect(validateNodeName("   ")).toBe("노드 이름을 입력해 주세요.");
  });

  it("앞뒤 공백을 제거한 뒤 길이를 판단한다", () => {
    const name = `  ${"가".repeat(MAX_NODE_NAME_LENGTH)}  `;

    expect(validateNodeName(name)).toBeNull();
  });

  it("30자까지는 통과시킨다", () => {
    expect(validateNodeName("가".repeat(MAX_NODE_NAME_LENGTH))).toBeNull();
  });

  it("30자를 초과하면 거부한다", () => {
    expect(validateNodeName("가".repeat(MAX_NODE_NAME_LENGTH + 1))).toBe(
      "노드 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });

  /*
  폴더 이름은 바이트 기준으로 검사하지만 노드 이름은 글자 수 기준이다.
  한글 30자는 UTF-8로 90바이트라 바이트 기준이었다면 걸렸을 입력이다.
  */
  it("한글과 영문을 같은 글자 수로 센다", () => {
    expect(validateNodeName("가".repeat(MAX_NODE_NAME_LENGTH))).toBeNull();
    expect(validateNodeName("a".repeat(MAX_NODE_NAME_LENGTH))).toBeNull();
  });

  /*
  백엔드의 Java String.length()는 UTF-16 코드 단위를 세므로 이모지 하나가 2자로 계산된다.
  JavaScript의 String.length도 같은 단위라 서버와 판정이 일치한다.
  */
  it("이모지를 UTF-16 코드 단위로 세어 서버와 판정을 맞춘다", () => {
    expect(validateNodeName("🌳".repeat(15))).toBeNull();
    expect(validateNodeName("🌳".repeat(16))).toBe(
      "노드 이름은 최대 30자까지 입력할 수 있습니다.",
    );
  });
});
