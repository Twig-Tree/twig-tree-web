import { describe, it, expect } from "vitest";
import { getAncestorClientIds } from "./getAncestorClientIds";
import { createEditorEdge } from "./add-node/createEditorEdge";

/*
c1
├─ c2
│  └─ c4
│     └─ c5
└─ c3
*/
const createEdge = (parentIndex: number, childIndex: number) =>
  createEditorEdge({
    sourceClientId: `c${parentIndex}`,
    targetClientId: `c${childIndex}`,
  });

const edges = [
  createEdge(1, 2),
  createEdge(1, 3),
  createEdge(2, 4),
  createEdge(4, 5),
];

describe("getAncestorClientIds", () => {
  it("루트는 조상이 없다", () => {
    expect(getAncestorClientIds(edges, "c1")).toEqual([]);
  });

  it("부모부터 루트까지 순서대로 모은다", () => {
    expect(getAncestorClientIds(edges, "c5")).toEqual(["c4", "c2", "c1"]);
    expect(getAncestorClientIds(edges, "c3")).toEqual(["c1"]);
  });

  it("트리에 없는 노드는 조상이 없다", () => {
    expect(getAncestorClientIds(edges, "c99")).toEqual([]);
  });

  it("엣지에 순환이 있어도 멈춘다", () => {
    const cyclicEdges = [createEdge(1, 2), createEdge(2, 1)];

    expect(getAncestorClientIds(cyclicEdges, "c2")).toEqual(["c1"]);
  });
});
