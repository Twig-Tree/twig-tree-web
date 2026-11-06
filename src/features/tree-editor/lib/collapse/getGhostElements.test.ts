import { describe, it, expect } from "vitest";
import { createEditorEdge } from "../add-node/createEditorEdge";
import { createEditorNode } from "../add-node/createEditorNode";
import {
  getExitingElements,
  getGhostEdges,
  getGhostNodes,
  getOriginalNodes,
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
    storedEdges: edges,
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

  it("보이는 조상 없이 순환하는 노드는 들어갈 자리가 없어 대상이 아니다", () => {
    const cycleEdges = [
      createEditorEdge({ sourceClientId: "a", targetClientId: "b" }),
      createEditorEdge({ sourceClientId: "b", targetClientId: "a" }),
    ];

    const exiting = getExitingElements({
      renderedNodes: [a, b],
      renderedEdges: cycleEdges,
      nodes: [],
      storedClientIds: new Set(["a", "b"]),
      storedEdges: cycleEdges,
    });

    expect(exiting).toEqual({ nodes: [], edges: [] });
  });

  it("순환에 묶이지 않은 노드는 보이는 조상을 그대로 찾는다", () => {
    const tailEdges = [
      createEditorEdge({ sourceClientId: "a", targetClientId: "b" }),
      createEditorEdge({ sourceClientId: "b", targetClientId: "a" }),
      createEditorEdge({ sourceClientId: "r", targetClientId: "c" }),
    ];

    const exiting = getExitingElements({
      renderedNodes: [a, b, c],
      renderedEdges: tailEdges,
      nodes: [r],
      storedClientIds: new Set(["r", "a", "b", "c"]),
      storedEdges: tailEdges,
    });

    expect(
      exiting.nodes.map(({ node, ancestorClientId }) => [
        node.id,
        ancestorClientId,
      ]),
    ).toEqual([["c", "r"]]);
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

  it("도착한 더미는 남기지 않는다", () => {
    expect(getGhostNodes(getExiting(), visibleNodes, 1)).toEqual([]);
  });

  it("조상이 사라졌으면 만들지 않는다", () => {
    expect(getGhostNodes(getExiting(), [r], 0.5)).toEqual([]);
  });
});

describe("getGhostEdges", () => {
  const visibleNodes = [r, a];
  const exiting = getExiting();
  const ghostNodes = getGhostNodes(exiting, visibleNodes, 0.25);

  it("보이는 조상에서 더미로, 더미에서 더미로 잇고 주어진 투명도로 그린다", () => {
    const ghostEdges = getGhostEdges(exiting, ghostNodes, 0.75);

    expect(ghostEdges.map(({ source, target }) => [source, target])).toEqual([
      ["a", "ghost:b"],
      ["ghost:b", "ghost:c"],
    ]);
    expect(ghostEdges[0].style?.opacity).toBe(0.75);
    expect(ghostEdges[0].id).toBe("ghost:e-a-b");
    expect(ghostEdges[0].selectable).toBe(false);
  });

  it("다 흐려졌거나 대상 더미를 그리지 않으면 만들지 않는다", () => {
    expect(getGhostEdges(exiting, ghostNodes, 0)).toEqual([]);
    expect(getGhostEdges(exiting, [], 0.5)).toEqual([]);
  });
});

describe("getOriginalNodes", () => {
  it("더미를 그려진 좌표와 투명도 그대로 원래 ID의 노드로 되돌린다", () => {
    const [ghost] = getGhostNodes(getExiting(), [r, a], 0.5);
    const [original] = getOriginalNodes([ghost]);

    expect(original.id).toBe("b");
    expect(original.type).toBe("custom");
    expect(original.position).toEqual(ghost.position);
    expect(original.style?.opacity).toBe(ghost.style?.opacity);
  });

  it("되돌린 노드를 다시 사라지는 노드로 찾으면 그 자리에서 이어 간다", () => {
    const [ghost] = getGhostNodes(getExiting(), [r, a], 0.5);
    const exiting = getExitingElements({
      renderedNodes: [r, ...getOriginalNodes([ghost])],
      renderedEdges: [],
      nodes: [r],
      storedClientIds: new Set(["r", "a", "b", "c"]),
      storedEdges: edges,
    });

    expect(exiting.nodes[0].ancestorClientId).toBe("r");
    expect(exiting.nodes[0].node.position).toEqual(ghost.position);
    expect(exiting.edges).toEqual([]);
  });
});
