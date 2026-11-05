import { describe, it, expect } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import {
  getNodePositions,
  getTransitionNodes,
  hasMovedNode,
} from "./getTransitionNodes";

const createNode = (clientId: string, x: number, y: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x,
    y,
  });

describe("getTransitionNodes", () => {
  it("시작 좌표와 목표 좌표 사이를 진행률만큼 옮긴다", () => {
    const [node] = getTransitionNodes(
      [createNode("a", 100, 200)],
      new Map([["a", { x: 0, y: 100 }]]),
      0.25,
    );

    expect(node.position).toEqual({ x: 25, y: 125 });
  });

  it("시작 좌표가 없거나 움직이지 않는 노드는 객체를 그대로 재사용한다", () => {
    const appeared = createNode("a", 100, 200);
    const stayed = createNode("b", 0, 0);

    const result = getTransitionNodes(
      [appeared, stayed],
      new Map([["b", { x: 0, y: 0 }]]),
      0.5,
    );

    expect(result[0]).toBe(appeared);
    expect(result[1]).toBe(stayed);
  });
});

describe("hasMovedNode", () => {
  it("시작 좌표와 다른 노드가 있으면 true다", () => {
    const nodes = [createNode("a", 100, 0)];

    expect(hasMovedNode(nodes, getNodePositions([createNode("a", 0, 0)]))).toBe(
      true,
    );
  });

  it("새로 나타난 노드만 있으면 움직일 것이 없다", () => {
    expect(hasMovedNode([createNode("a", 100, 0)], new Map())).toBe(false);
  });
});
