import { describe, it, expect } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import { getExitingNodes, getGhostNodes } from "./getGhostElements";

const createNode = (clientId: string, x: number, y: number) =>
  createEditorNode({
    clientId,
    serverId: `s-${clientId}`,
    label: clientId,
    orderIndex: 1,
    x,
    y,
  });

/*
r ── a ── b ── c
*/
const r = createNode("r", 0, 0);
const a = createNode("a", 100, 0);
const b = createNode("b", 200, 0);
const c = createNode("c", 300, 100);
const edges = [
  createEditorEdge({ sourceClientId: "r", targetClientId: "a" }),
  createEditorEdge({ sourceClientId: "a", targetClientId: "b" }),
  createEditorEdge({ sourceClientId: "b", targetClientId: "c" }),
];

const getExiting = (storedClientIds = ["r", "a", "b", "c"]) =>
  getExitingNodes({
    renderedNodes: [r, a, b, c],
    renderedEdges: edges,
    nodes: [r, { ...a, position: { x: 100, y: 50 } }],
    storedClientIds: new Set(storedClientIds),
  });

describe("getExitingNodes", () => {
  it("화면에서 빠진 노드와 들어갈 조상을 찾는다", () => {
    expect(
      getExiting().map(({ node, ancestorClientId }) => [
        node.id,
        ancestorClientId,
      ]),
    ).toEqual([
      ["b", "a"],
      ["c", "a"],
    ]);
  });

  it("store에서도 사라진 노드는 삭제된 것이므로 대상이 아니다", () => {
    expect(getExiting(["r", "a", "b"]).map(({ node }) => node.id)).toEqual([
      "b",
    ]);
  });
});

describe("getGhostNodes", () => {
  const visibleNodes = [r, { ...a, position: { x: 100, y: 50 } }];

  it("조상의 최종 자리로 진행률만큼 옮기고 그만큼 흐리게 한다", () => {
    const [ghost] = getGhostNodes(getExiting(), visibleNodes, 0.5);

    expect(ghost.id).toBe("ghost:b");
    expect(ghost.type).toBe("ghost");
    expect(ghost.position).toEqual({ x: 150, y: 25 });
    expect(ghost.style?.opacity).toBe(0.5);
  });

  it("조작을 모두 막고 조상 뒤에 그린다", () => {
    const [ghost] = getGhostNodes(getExiting(), visibleNodes, 0);

    expect(ghost).toMatchObject({
      selected: false,
      draggable: false,
      selectable: false,
      focusable: false,
      connectable: false,
      deletable: false,
      zIndex: -1,
    });
    expect(ghost.style?.pointerEvents).toBe("none");
  });

  it("조상이 사라졌으면 만들지 않는다", () => {
    expect(getGhostNodes(getExiting(), [r], 0.5)).toEqual([]);
  });
});
