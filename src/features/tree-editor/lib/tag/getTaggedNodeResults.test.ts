import { describe, it, expect } from "vitest";
import { getTaggedNodeResults } from "./getTaggedNodeResults";
import { createEditorNode } from "../add-node/createEditorNode";

const createNode = (index: number, tagIds: string[]) => {
  const node = createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
    label: `node ${index}`,
    orderIndex: index,
    x: 0,
    y: 0,
  });

  return { ...node, data: { ...node.data, tagIds } };
};

const nodes = [
  createNode(1, ["t1"]),
  createNode(2, []),
  createNode(3, ["t2", "t1"]),
];

describe("getTaggedNodeResults", () => {
  it("태그가 붙은 노드를 노드 배열 순서대로 메모 일치 없이 모은다", () => {
    expect(getTaggedNodeResults(nodes, "t1")).toEqual([
      { clientId: "c1", label: "node 1", isMemoMatched: false },
      { clientId: "c3", label: "node 3", isMemoMatched: false },
    ]);
  });

  it("태그가 붙은 노드가 없으면 빈 배열을 돌려준다", () => {
    expect(getTaggedNodeResults(nodes, "t9")).toEqual([]);
  });
});
