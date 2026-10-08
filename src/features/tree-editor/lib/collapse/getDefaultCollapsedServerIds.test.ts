import { describe, it, expect } from "vitest";
import { getDefaultCollapsedServerIds } from "./getDefaultCollapsedServerIds";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";

/*
편집기 노드 ID는 c, serverId는 s로 시작한다.
*/
const createNode = (index: number, serverId: string | null = `s${index}`) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId,
    label: `node ${index}`,
    orderIndex: 1,
    x: 0,
    y: 0,
  });

const createEdge = (parentIndex: number, childIndex: number) =>
  createEditorEdge({
    sourceClientId: `c${parentIndex}`,
    targetClientId: `c${childIndex}`,
  });

describe("getDefaultCollapsedServerIds", () => {
  it("깊이 2인 노드 중 자식이 있는 노드만 접는다", () => {
    /*
    c1              깊이 0
    ├─ c2           깊이 1
    │  ├─ c4        깊이 2, 자식 있음 → 접음
    │  │  └─ c6     깊이 3
    │  │     └─ c7  깊이 4
    │  └─ c5        깊이 2, 자식 없음
    └─ c3           깊이 1
       └─ c8        깊이 2, 자식 있음 → 접음
          └─ c9     깊이 3
    */
    const nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => createNode(index));
    const edges = [
      createEdge(1, 2),
      createEdge(1, 3),
      createEdge(2, 4),
      createEdge(2, 5),
      createEdge(4, 6),
      createEdge(6, 7),
      createEdge(3, 8),
      createEdge(8, 9),
    ];

    expect(getDefaultCollapsedServerIds(nodes, edges, 2)).toEqual(["s4", "s8"]);
  });

  it("깊이 2까지만 있는 트리는 접을 노드가 없다", () => {
    const nodes = [1, 2, 3].map((index) => createNode(index));
    const edges = [createEdge(1, 2), createEdge(2, 3)];

    expect(getDefaultCollapsedServerIds(nodes, edges, 2)).toEqual([]);
  });

  it("노드가 없는 트리는 접을 노드가 없다", () => {
    expect(getDefaultCollapsedServerIds([], [], 2)).toEqual([]);
  });

  it("serverId가 없는 노드는 접지 않는다", () => {
    const nodes = [
      createNode(1),
      createNode(2),
      createNode(3, null),
      createNode(4),
    ];
    const edges = [createEdge(1, 2), createEdge(2, 3), createEdge(3, 4)];

    expect(getDefaultCollapsedServerIds(nodes, edges, 2)).toEqual([]);
  });
});
