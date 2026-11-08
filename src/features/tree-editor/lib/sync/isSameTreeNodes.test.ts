import { describe, expect, it } from "vitest";
import { TreeNode } from "@/src/entities/tree";
import { isSameTreeNodes } from "./isSameTreeNodes";

const createNode = (
  id: string,
  overrides: Partial<TreeNode> = {},
): TreeNode => ({
  id,
  parentId: "1",
  label: `node ${id}`,
  orderIndex: 1,
  memo: null,
  version: 0,
  tagIds: [],
  ...overrides,
});

describe("isSameTreeNodes", () => {
  it("배열 순서만 다르면 같다고 본다", () => {
    expect(
      isSameTreeNodes(
        [createNode("2"), createNode("3")],
        [createNode("3"), createNode("2")],
      ),
    ).toBe(true);
  });

  it("태그 순서만 다르면 같다고 본다", () => {
    expect(
      isSameTreeNodes(
        [createNode("2", { tagIds: ["7", "8"] })],
        [createNode("2", { tagIds: ["8", "7"] })],
      ),
    ).toBe(true);
  });

  it.each<[string, Partial<TreeNode>]>([
    ["부모", { parentId: "9" }],
    ["제목", { label: "바뀐 제목" }],
    ["순번", { orderIndex: 2 }],
    ["메모", { memo: "바뀐 메모" }],
    ["version", { version: 1 }],
    ["태그", { tagIds: ["7"] }],
  ])("%s이 다르면 다르다고 본다", (_field, overrides) => {
    expect(
      isSameTreeNodes([createNode("2")], [createNode("2", overrides)]),
    ).toBe(false);
  });

  it("태그 수가 같아도 다른 태그면 다르다고 본다", () => {
    expect(
      isSameTreeNodes(
        [createNode("2", { tagIds: ["7"] })],
        [createNode("2", { tagIds: ["8"] })],
      ),
    ).toBe(false);
  });

  it("노드가 늘거나 줄면 다르다고 본다", () => {
    expect(
      isSameTreeNodes([createNode("2")], [createNode("2"), createNode("3")]),
    ).toBe(false);
  });

  it("노드 수가 같아도 다른 노드면 다르다고 본다", () => {
    expect(isSameTreeNodes([createNode("2")], [createNode("3")])).toBe(false);
  });

  it("메모 null과 빈 문자열을 구분한다", () => {
    expect(
      isSameTreeNodes(
        [createNode("2", { memo: null })],
        [createNode("2", { memo: "" })],
      ),
    ).toBe(false);
  });
});
