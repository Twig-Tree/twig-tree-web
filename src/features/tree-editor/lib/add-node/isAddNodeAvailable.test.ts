import { describe, it, expect } from "vitest";
import { isAddNodeAvailable } from "./isAddNodeAvailable";

describe("isAddNodeAvailable", () => {
  it("노드가 없는 트리는 선택 없이도 루트를 추가할 수 있다", () => {
    expect(
      isAddNodeAvailable({ treeId: "1", nodeCount: 0, hasSelectedNode: false }),
    ).toBe(true);
  });

  it("트리가 없으면 추가할 수 없다", () => {
    expect(
      isAddNodeAvailable({
        treeId: null,
        nodeCount: 0,
        hasSelectedNode: false,
      }),
    ).toBe(false);
  });

  it("노드가 있으면 기준 노드를 선택했을 때만 추가할 수 있다", () => {
    expect(
      isAddNodeAvailable({ treeId: "1", nodeCount: 3, hasSelectedNode: true }),
    ).toBe(true);
    expect(
      isAddNodeAvailable({ treeId: "1", nodeCount: 3, hasSelectedNode: false }),
    ).toBe(false);
  });
});
