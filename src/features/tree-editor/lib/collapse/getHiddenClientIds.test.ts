import { describe, it, expect } from "vitest";
import { getHiddenClientIds } from "./getHiddenClientIds";
import { createEditorNode } from "../add-node/createEditorNode";
import { createEditorEdge } from "../add-node/createEditorEdge";

/*
편집기 노드 ID와 serverId가 다른 값이어야 함수가 둘을 섞어 쓰지 않는지 확인할 수 있다.
편집기 노드 ID는 c, serverId는 s로 시작한다.

c1
├─ c2
│  ├─ c4
│  │  └─ c6
│  │     └─ c7
│  └─ c5
└─ c3
*/
const createNode = (index: number) =>
  createEditorNode({
    clientId: `c${index}`,
    serverId: `s${index}`,
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

const nodes = [1, 2, 3, 4, 5, 6, 7].map(createNode);
const edges = [
  createEdge(1, 2),
  createEdge(1, 3),
  createEdge(2, 4),
  createEdge(2, 5),
  createEdge(4, 6),
  createEdge(6, 7),
];

describe("getHiddenClientIds", () => {
  it("접힌 노드가 없으면 아무 노드도 숨기지 않는다", () => {
    expect(getHiddenClientIds(nodes, edges, new Set())).toEqual(new Set());
  });

  it("접힌 노드의 모든 자손을 숨기고, 접힌 노드 자신은 숨기지 않는다", () => {
    expect(getHiddenClientIds(nodes, edges, new Set(["s2"]))).toEqual(
      new Set(["c4", "c5", "c6", "c7"]),
    );
  });

  it("루트를 접으면 루트를 뺀 모든 노드를 숨긴다", () => {
    expect(getHiddenClientIds(nodes, edges, new Set(["s1"]))).toEqual(
      new Set(["c2", "c3", "c4", "c5", "c6", "c7"]),
    );
  });

  it("접힌 노드 아래에 또 접힌 노드가 있으면 바깥 노드의 자손을 한 번씩만 숨긴다", () => {
    expect(getHiddenClientIds(nodes, edges, new Set(["s2", "s4"]))).toEqual(
      new Set(["c4", "c5", "c6", "c7"]),
    );
  });

  it("트리에 없는 serverId는 무시한다", () => {
    expect(getHiddenClientIds(nodes, edges, new Set(["s4", "s99"]))).toEqual(
      new Set(["c6", "c7"]),
    );
  });

  it("serverId가 아니라 편집기 노드 ID로 접힘 목록을 찾지 않는다", () => {
    expect(getHiddenClientIds(nodes, edges, new Set(["c2"]))).toEqual(
      new Set(),
    );
  });
});
