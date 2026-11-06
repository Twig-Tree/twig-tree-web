import { describe, it, expect } from "vitest";
import { getTreeDepth } from "./getTreeDepth";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";

const createNode = (clientId: string) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x: 0,
    y: 0,
  });

const createEdge = (sourceClientId: string, targetClientId: string) =>
  createEditorEdge({ sourceClientId, targetClientId });

describe("getTreeDepth", () => {
  it("노드가 없으면 0이다", () => {
    expect(getTreeDepth([], [])).toBe(0);
  });

  it("루트만 있으면 0이다", () => {
    expect(getTreeDepth([createNode("r")], [])).toBe(0);
  });

  it("가지마다 깊이가 달라도 가장 깊은 값을 돌려준다", () => {
    const nodes = ["r", "a", "b", "a1", "a11"].map(createNode);
    const edges = [
      createEdge("r", "a"),
      createEdge("r", "b"),
      createEdge("a", "a1"),
      createEdge("a1", "a11"),
    ];

    expect(getTreeDepth(nodes, edges)).toBe(3);
  });

  it("순환이 있어도 계산이 끝난다", () => {
    const nodes = ["r", "a", "b"].map(createNode);
    const edges = [
      createEdge("r", "a"),
      createEdge("a", "b"),
      createEdge("b", "a"),
    ];

    expect(getTreeDepth(nodes, edges)).toBe(2);
  });
});
