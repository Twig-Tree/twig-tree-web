import { describe, it, expect } from "vitest";
import type { TreeTag } from "@/src/entities/tree";
import { findTagByName } from "./findTagByName";

const tags: TreeTag[] = [
  { id: "t1", name: "React" },
  { id: "t2", name: "중요" },
];

describe("findTagByName", () => {
  it("이름이 같은 태그를 찾는다", () => {
    expect(findTagByName(tags, "중요")).toEqual({ id: "t2", name: "중요" });
  });

  it("대소문자만 다른 이름도 같은 태그로 본다", () => {
    expect(findTagByName(tags, "react")).toEqual({ id: "t1", name: "React" });
  });

  it("입력의 앞뒤 공백을 지우고 비교한다", () => {
    expect(findTagByName(tags, "  React  ")).toEqual({
      id: "t1",
      name: "React",
    });
  });

  it("일부만 같은 이름은 같은 태그로 보지 않는다", () => {
    expect(findTagByName(tags, "Rea")).toBeUndefined();
  });

  it("빈 입력이나 공백뿐인 입력은 찾지 않는다", () => {
    expect(findTagByName(tags, "")).toBeUndefined();
    expect(findTagByName(tags, "   ")).toBeUndefined();
  });
});
