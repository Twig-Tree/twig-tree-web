import { describe, it, expect } from "vitest";
import type { TreeTag } from "@/src/entities/tree";
import { getTagSuggestions } from "./getTagSuggestions";

const tags: TreeTag[] = [
  { id: "t1", name: "React" },
  { id: "t2", name: "React Native" },
  { id: "t3", name: "중요" },
  { id: "t4", name: "복습 필요" },
];

const getIds = (suggestions: TreeTag[]) => suggestions.map((tag) => tag.id);

describe("getTagSuggestions", () => {
  it("이름에 입력값이 들어 있는 태그를 트리 태그 목록 순서대로 모은다", () => {
    expect(getIds(getTagSuggestions(tags, "act", []))).toEqual(["t1", "t2"]);
  });

  it("대소문자를 무시하고 입력의 앞뒤 공백을 지운다", () => {
    expect(getIds(getTagSuggestions(tags, "  NATIVE ", []))).toEqual(["t2"]);
  });

  it("이미 노드에 붙은 태그는 뺀다", () => {
    expect(getIds(getTagSuggestions(tags, "react", ["t1"]))).toEqual(["t2"]);
  });

  it("입력이 비어 있으면 붙지 않은 태그를 모두 보여 준다", () => {
    expect(getIds(getTagSuggestions(tags, " ", ["t3"]))).toEqual([
      "t1",
      "t2",
      "t4",
    ]);
  });

  it("일치하는 태그가 없으면 빈 배열을 돌려준다", () => {
    expect(getTagSuggestions(tags, "Vue", [])).toEqual([]);
  });
});
