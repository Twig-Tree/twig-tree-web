import { describe, expect, it } from "vitest";
import { createLectureCompilerTree } from "./createLectureCompilerTree";

describe("createLectureCompilerTree", () => {
  const tree = createLectureCompilerTree([
    { id: "1", parentId: null },
    { id: "3", parentId: "1" },
    { id: "2", parentId: "1" },
    { id: "4", parentId: "2" },
  ]);

  it("형제 순서는 목록 순서를 따른다", () => {
    expect(tree.getChildIds("1")).toEqual(["3", "2"]);
    expect(tree.getChildIds("4")).toEqual([]);
    expect(tree.getChildIds("99")).toEqual([]);
  });

  it("조상에서 자손까지 부모→자식 순서의 경로를 찾고, 조상이 아니면 null이다", () => {
    expect(tree.getPathNodeIds("1", "4")).toEqual(["1", "2", "4"]);
    expect(tree.getPathNodeIds("4", "4")).toEqual(["4"]);
    expect(tree.getPathNodeIds("4", "1")).toBeNull();
    expect(tree.getPathNodeIds("3", "4")).toBeNull();
    expect(tree.getPathNodeIds("1", "99")).toBeNull();
  });

  it("순환이 있는 데이터에서도 멈춘다", () => {
    const cyclic = createLectureCompilerTree([
      { id: "1", parentId: "2" },
      { id: "2", parentId: "1" },
    ]);

    expect(cyclic.getPathNodeIds("3", "1")).toBeNull();
  });

  it("목록에 없는 부모와는 이어지지 않는다", () => {
    const orphan = createLectureCompilerTree([
      { id: "1", parentId: null },
      { id: "2", parentId: "99" },
    ]);

    expect(orphan.hasNode("2")).toBe(true);
    expect(orphan.getChildIds("99")).toEqual([]);
    expect(orphan.getPathNodeIds("99", "2")).toBeNull();
    expect(orphan.getPathNodeIds("1", "2")).toBeNull();
  });
});
