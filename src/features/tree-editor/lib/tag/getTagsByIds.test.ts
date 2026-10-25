import { describe, it, expect } from "vitest";
import type { TreeTag } from "@/src/entities/tree";
import { getTagsByIds } from "./getTagsByIds";

const tags: TreeTag[] = [
  { id: "t1", name: "React" },
  { id: "t2", name: "중요" },
  { id: "t3", name: "복습 필요" },
];

describe("getTagsByIds", () => {
  it("트리 태그 목록 순서가 아니라 노드에 붙인 순서를 따른다", () => {
    expect(getTagsByIds(tags, ["t3", "t1"])).toEqual([
      { id: "t3", name: "복습 필요" },
      { id: "t1", name: "React" },
    ]);
  });

  it("트리 태그 목록에 없는 ID는 건너뛴다", () => {
    expect(getTagsByIds(tags, ["t9", "t2"])).toEqual([
      { id: "t2", name: "중요" },
    ]);
  });
});
