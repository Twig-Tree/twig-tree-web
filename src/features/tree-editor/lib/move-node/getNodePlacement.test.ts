import { describe, it, expect } from "vitest";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { getNodePlacement } from "./getNodePlacement";

const createNode = (clientId: string) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x: 0,
    y: 0,
  });

/*
r 밑에 a, b가 있고 a 밑에 a1이 있다. 배열에서 a1이 형제 a와 b 사이에 끼어 있다.
*/
const nodes = ["r", "a", "a1", "b"].map(createNode);
const edges = [
  createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
  createEditorEdge({ sourceClientId: "a", targetClientId: "a1" }),
  createEditorEdge({ sourceClientId: "r", targetClientId: "b" }),
];

describe("getNodePlacement", () => {
  it("형제 사이의 배열 순서로 순번을 센다", () => {
    expect(getNodePlacement(nodes, edges, "b")).toEqual({
      parentClientId: "r",
      position: 2,
    });
    expect(getNodePlacement(nodes, edges, "a1")).toEqual({
      parentClientId: "a",
      position: 1,
    });
  });

  it("루트나 트리에 없는 노드는 null이다", () => {
    expect(getNodePlacement(nodes, edges, "r")).toBeNull();
    expect(getNodePlacement(nodes, edges, "x")).toBeNull();
  });
});
