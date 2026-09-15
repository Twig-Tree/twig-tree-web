import { describe, it, expect } from "vitest";
import { isAddNodeAvailable } from "./isAddNodeAvailable";

describe("isAddNodeAvailable", () => {
  it("노드가 없으면 선택 없이도 루트를 추가할 수 있다", () => {
    expect(isAddNodeAvailable({ nodeCount: 0, hasSelectedNode: false })).toBe(
      true,
    );
  });

  it("노드가 있으면 기준 노드를 선택했을 때만 추가할 수 있다", () => {
    expect(isAddNodeAvailable({ nodeCount: 3, hasSelectedNode: true })).toBe(
      true,
    );
    expect(isAddNodeAvailable({ nodeCount: 3, hasSelectedNode: false })).toBe(
      false,
    );
  });
});
