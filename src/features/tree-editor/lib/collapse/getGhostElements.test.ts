import { describe, it, expect } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import {
  getExitingElements,
  getGhostEdges,
  getGhostNodes,
} from "./getGhostElements";

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
  getExitingElements({
    renderedNodes: [r, a, b, c],
    renderedEdges: edges,
    nodes: [r, { ...a, position: { x: 100, y: 50 } }],
    storedClientIds: new Set(storedClientIds),
  });

describe("getExitingElements", () => {
  it("화면에서 빠진 노드와 들어갈 조상, 그 노드로 들어가는 엣지를 찾는다", () => {
    const exiting = getExiting();

    expect(
      exiting.nodes.map(({ node, ancestorClientId }) => [
        node.id,
        ancestorClientId,
      ]),
    ).toEqual([
      ["b", "a"],
      ["c", "a"],
    ]);
    expect(exiting.edges.map((edge) => edge.target)).toEqual(["b", "c"]);
  });

  it("store에서도 사라진 노드는 삭제된 것이므로 대상이 아니다", () => {
    const exiting = getExiting(["r", "a", "b"]);

    expect(exiting.nodes.map(({ node }) => node.id)).toEqual(["b"]);
    expect(exiting.edges.map((edge) => edge.target)).toEqual(["b"]);
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

describe("getGhostEdges", () => {
  const visibleNodes = [r, a];

  it("보이는 조상에서 더미로, 더미에서 더미로 잇고 대상 더미의 투명도를 따른다", () => {
    const exiting = getExiting();
    const ghostEdges = getGhostEdges(
      exiting,
      getGhostNodes(exiting, visibleNodes, 0.25),
    );

    expect(ghostEdges.map(({ source, target }) => [source, target])).toEqual([
      ["a", "ghost:b"],
      ["ghost:b", "ghost:c"],
    ]);
    expect(ghostEdges[0].style?.opacity).toBe(0.75);
    expect(ghostEdges[0].id).toBe("ghost:e-a-b");
    expect(ghostEdges[0].selectable).toBe(false);
  });

  it("대상 더미를 그리지 않으면 엣지도 만들지 않는다", () => {
    expect(getGhostEdges(getExiting(), [])).toEqual([]);
  });
});
